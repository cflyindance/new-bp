param(
    [string]$KposBaseUrl = "http://192.168.96.96:22080/kpos",
    [string]$LicenseName = "POS-CAFY-B"
)

$ErrorActionPreference = "Stop"
$soapBegin = '<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://ws.kpos.com/app"><soapenv:Header/><soapenv:Body>'
$soapEnd = '</soapenv:Body></soapenv:Envelope>'
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

function Escape-Xml([object]$Value) {
    return [System.Security.SecurityElement]::Escape([string]$Value)
}

function Invoke-KposSoap([string]$Operation, [string]$Body = "") {
    $xml = "$soapBegin<app:$Operation>$Body</app:$Operation>$soapEnd"
    $response = Invoke-WebRequest -UseBasicParsing -Uri "$KposBaseUrl/ws/kposService" -Method Post -ContentType "text/xml; charset=utf-8" -Body $xml -WebSession $session -TimeoutSec 15
    [xml]$document = $response.Content
    $fault = $document.SelectSingleNode("//*[local-name()='Fault']")
    if ($fault) { throw "KPOS SOAP fault: $($fault.InnerText)" }
    $failed = $document.SelectSingleNode("//*[local-name()='result']/*[local-name()='successful' and translate(text(),'FALSE','false')='false']")
    if ($failed) {
        $reason = $document.SelectSingleNode("//*[local-name()='result']/*[local-name()='failureReason']")
        throw "KPOS rejected $Operation`: $($reason.InnerText)"
    }
    return $document
}

function Child-Text([System.Xml.XmlNode]$Node, [string]$Name) {
    $child = $Node.SelectSingleNode("./*[local-name()='$Name']")
    if ($child) { return $child.InnerText }
    return ""
}

$loginBody = @{ appInstanceName = $LicenseName; appInstanceType = "POS"; secretKey = "" } | ConvertTo-Json -Compress
$loginResponse = Invoke-WebRequest -UseBasicParsing -Uri "$KposBaseUrl/webapp/license/clientInstanceLogin" -Method Post -ContentType "application/json" -Body $loginBody -WebSession $session -TimeoutSec 15
$login = $loginResponse.Content | ConvertFrom-Json
if (-not $login.result.successful) { throw "KPOS license login failed: $($login.result.failureReason)" }

$before = Invoke-KposSoap "ListAreasType" '<app:fetchOrders>false</app:fetchOrders>'
$areaNodes = $before.SelectNodes("//*[local-name()='ListAreasResponseType']/*[local-name()='areas']")
$areaIdByName = @{}
$tablesByName = @{}
foreach ($areaNode in $areaNodes) {
    $areaName = Child-Text $areaNode "name"
    $areaIdByName[$areaName] = Child-Text $areaNode "id"
    foreach ($tableNode in $areaNode.SelectNodes("./*[local-name()='tables']")) {
        $tableName = Child-Text $tableNode "name"
        if ($tablesByName.ContainsKey($tableName)) { throw "Duplicate KPOS table name: $tableName" }
        $tablesByName[$tableName] = $tableNode
    }
}

$floor1 = @('1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','101','A6','BAR1','BAR2','BAR3','BAR4','BAR5','BAR6','BAR7','BAR8','H1','H2','H3','H4','H5','H6')
$floor2 = @('21','22','23','24','25','26','27','28','29','R1','R2','S1','S2','S3','S4','S5','S6','S7','S8')
$ktv = @('KTV1','KTV2','KTV3')
$expected = @($floor1 + $floor2 + $ktv)
if ($tablesByName.Count -ne 55 -or $expected.Count -ne 55) { throw "Expected exactly 55 KPOS tables; found $($tablesByName.Count)" }
foreach ($name in $expected) {
    if (-not $tablesByName.ContainsKey($name)) { throw "Required KPOS table is missing: $name" }
}
foreach ($areaName in @('Floor 1','Floor 2','KTV')) {
    if (-not $areaIdByName.ContainsKey($areaName)) { throw "Required KPOS area is missing: $areaName" }
}

$targetAreaByTable = @{}
foreach ($name in $floor1) { $targetAreaByTable[$name] = $areaIdByName['Floor 1'] }
foreach ($name in $floor2) { $targetAreaByTable[$name] = $areaIdByName['Floor 2'] }
foreach ($name in $ktv) { $targetAreaByTable[$name] = $areaIdByName['KTV'] }

function Save-AreaAssignment([string]$AreaName, [string[]]$TableNames) {
    $areaNode = $areaNodes | Where-Object { (Child-Text $_ 'name') -eq $AreaName } | Select-Object -First 1
    $areaId = Child-Text $areaNode 'id'
    $areaBody = "<app:name>$(Escape-Xml $AreaName)</app:name><app:id>$(Escape-Xml $areaId)</app:id>"
    foreach ($sizeField in @('areaWidth','areaHeight')) {
        $sizeValue = Child-Text $areaNode $sizeField
        if ($sizeValue -ne '') { $areaBody += "<app:$sizeField>$(Escape-Xml $sizeValue)</app:$sizeField>" }
    }
    foreach ($name in $TableNames) {
        $table = $tablesByName[$name]
        $tableBody = ""
        foreach ($field in @('id','name','x','y','defaultGuestCount')) {
            $tableBody += "<app:$field>$(Escape-Xml (Child-Text $table $field))</app:$field>"
        }
        $tableBody += "<app:areaId>$(Escape-Xml $areaId)</app:areaId>"
        foreach ($field in @('width','height','shape','defaultSaleItemId')) {
            $value = Child-Text $table $field
            if ($value -ne '') { $tableBody += "<app:$field>$(Escape-Xml $value)</app:$field>" }
        }
        $areaBody += "<app:tables>$tableBody</app:tables>"
    }
    Invoke-KposSoap "SaveSeatingAreaType" "<app:areaType>$areaBody</app:areaType>" | Out-Null
}

# Move tables into the two empty target areas first, then write Floor 1's exact
# membership last. This mirrors KPOS's native SaveAreaType implementation.
Save-AreaAssignment 'Floor 2' $floor2
Save-AreaAssignment 'KTV' $ktv
Save-AreaAssignment 'Floor 1' $floor1
$moved = @($floor2 + $ktv)

$after = Invoke-KposSoap "ListAreasType" '<app:fetchOrders>false</app:fetchOrders>'
$actual = @{}
foreach ($areaNode in $after.SelectNodes("//*[local-name()='ListAreasResponseType']/*[local-name()='areas']")) {
    $areaName = Child-Text $areaNode "name"
    $actual[$areaName] = @($areaNode.SelectNodes("./*[local-name()='tables']") | ForEach-Object { Child-Text $_ "name" })
}
foreach ($areaName in @('Floor 1','Floor 2','KTV')) {
    $wanted = if ($areaName -eq 'Floor 1') { $floor1 } elseif ($areaName -eq 'Floor 2') { $floor2 } else { $ktv }
    $missing = @($wanted | Where-Object { $_ -notin $actual[$areaName] })
    $unexpected = @($actual[$areaName] | Where-Object { $_ -notin $wanted })
    if ($missing.Count -or $unexpected.Count) {
        throw "Verification failed for $areaName; missing=$($missing -join ','); unexpected=$($unexpected -join ',')"
    }
}

[pscustomobject]@{
    Moved = $moved.Count
    Floor1 = $actual['Floor 1'].Count
    Floor2 = $actual['Floor 2'].Count
    KTV = $actual['KTV'].Count
    MovedTables = ($moved -join ',')
}
