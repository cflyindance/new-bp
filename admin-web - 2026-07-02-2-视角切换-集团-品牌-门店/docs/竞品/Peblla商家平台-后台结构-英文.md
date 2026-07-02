# Peblla商家平台 - 后台结构（英文）

## Report

- Sales Overview
  - Sales Summary
  - Net Sales
  - Order Volume
  - Refund
  - Unclosed Order
  - Sales By Date
  - Top Category Sales
  - Top Items Sales
  - Top Add-ons Sales
  - New Report
    - Sales
      - Sales Overview
      - Sales Summary
      - Order Details
    - Payments
      - Transaction Details
      - Monthly Statement
      - Payout Summary
      - Deposit Daily Breakdown
      - Invoices
      - Disputes
    - Employee Performance
      - Tips Management
      - Shift Details
      - Break Details
    - Cash Management
      - Cash Drawer History
- Items Sales
- Menu Sales
- Menu Net Payouts
- Transaction Details
- Gift Card Transactions
- Taxes Overview
- Third-Party Channel
- Void Report
- POS Discount Report

## Analytics

- Member Insight
- Members Loyalty
- Members Purchase
- Kiosk Analytics
- Upsell Analytics
- Al Phone Analytics

## Promotions

- Promotions
- Rewards Center

## Menu

- Menu
- Categories
- Categories Promote
- Items
- Item Template
- Combo
- Add-Ons
- Pre/Post Modifier

## Order

- Orders
- Order Details Export

## Member

- Members
- Member Group
- Review

## Integration

- 3rd Party Integration

## Management

- Store
- Employee
- Shifts
- Tip Pooling

## Group Buy

- Group Buy
- Group Buy Item
- Group Buy Locations
- SMS
- Group Buy Order

## Table Service

- Tables
- Tables Layout
- Dining Flow Control
- Customized Service
- Order at Table Setting
- Waitlist & Reservation
- Reservation Details
- Coursing
- Tiered Menu

## Settings

### Order Settings

- Order Settings
  - Order Sequence Setting
    - *Max Sequence No.
    - Sequence No. Prefix
      - (Only A-Z can be entered)
      - Kiosk order
      - Counter POS order
      - Web order
      - App order
  - Future Order Setting
    - Enable Future Orders
    - *Future Order Days
      - Allow guests to order ahead through the end of the day.
    - *Remind In
  - Online Order & Order Status Setting
    - System Default Pick up Estimate
    - Pick Up Time Estimate
    - Automatically Switchto Ready Status
    - Automatically Switchto Complete Status
    - Switch to Complete After
  - Table Service Setting
    - Seat Numbers
  - Customer Visibility
    - This section will only be available on the customer end and will not affect POS.
    - Enable Order Notes
    - Enable Item Notes
    - Customer Visibility for Sold Out Items
      - Visible to customers
      - Hidden from customers
  - Order Notes Settings
    - Notes
      - Item Notes (Online)
      - Order Notes (Online)
      - Decline Reason
      - Refund Reason
      - Partial Refund Reason
      - POS Send SMS
- POS Discount Option
  - Discount Name
  - Discount Type
  - Value
  - Operation Time
  - Sort
  - Action

### Sales Settings

- Store Activation Setting
  - Store Activation Status
  - Online Order Channels Status
    - Online order channels include App/Web/Kiosk
  - Third-Party Channels
- Settlement Time Setting
  - Settlement Time
    - Please note: payment clearing and settlement timelines are not affected.
- Store Hour Settings
  - Business Hours
  - Special Business Hours
    - *For special occasions like holiday closings or extended hours. Will override regular business hours.

### Taxes Settings

- + Add Tax
  - Name
  - Тах Туре
    - Percentage
    - Fixed
  - Default Tax
  - To-Go Tax
- 列表
  - Default
  - Name
  - Tax
  - To-Go Tax
  - Actions

### Payment Settings

- Service Charge
  - Name, setup and add service charges. E.g. bag fees, kitchen appreciation fee.
  - 列表
    - Name
    - Amount
    - Taxable
    - Apply on
    - Auto Apply
    - Action
  - Create
    - * Name
    - Charge Amount
      - Percent
      - Fixed Amount
    - Amount Threshold
    - * Taxability
      - Non-taxable
      - Use Default Tax
    - Dining Type
      - Take Out
      - Dine In
      - Pick Up
      - Delivery
      - Phone Order
    - Auto Apply
      - Auto-apply on all channels
      - On: applies by default on POS, App, Web, and Kiosk.
      - Off: online channels won't auto-apply; apply manually on POS.
- Tip Setting
  - Order actual payment amount
    - Tip Amount
      - Quick Service
        - Enable Tip
        - Tip Options
          - Percentage
          - Fixed Amount
        - * Default Selection
      - Table Service
      - Online Order
    - Enable Gift Card Tipping
    - Auto-Gratuity
  - Subtotal
  - Sum of all subtotal, tax and fees
- Customized Payment Method
  - Once added, customized payment methods will be available on POS and support tips, refunds, reporting and other functions.
- Cash Discount
  - Enable Cash Discount
- Dual Pricing
  - Dual Pricing currently only applies to kiosks have cash payment. The rest of the sales channels will still use the items' base price, regardless of the CASH and CARD settings.
  - If you enable it, please make sure you have upgrade the POS to version 2.29.0 or later, the Kiosk to Version 1.32.0 or later.
  - Enable Dual Pricing

### Delivery Settings

- In-House Delivery
  - Delivery Range
  - Distance Calculated
    - By straight line distance
    - By driving distance(google)
  - * Minimum Order Amount
  - Delivery Fee
    - Charge delivery fee
    - Free delivery
  - * Estimated Delivery Time
  - Notes for Customer
  - Driver Tip Setting
  - Accept Order Notification
- DoorDash Delivery

### Notification

- Add
  - * Name
  - Email Address
  - Phone
- 列表
  - Notification
  - Name
  - Email Address
  - Phone
  - Email Notification
    - Transaction Report
    - Store Account Notification
    - Message Notification
    - Customer Review Notification
    - Sales Overview Report
    - Failed Offline Payment Notification
    - Void Notification
    - Refund Notification
    - Cash Drawer Operation Log
    - Uncaptured Transaction Reminder
  - SMS Notification
  - Action

### Print Settings

- LOGO
- Advertising Picture
  - Upload your App QR code or advertising picture to print it on the receipt. The maximum capacity of the image is 2M.
- Print Dining Type & Sequence Number
- Print Order Ready QR-Code
- Font Size
  - Small
  - Medium
  - Large
  - Extra Large
- Print Content
  - Print All Items
  - Hide Free Items
- Consolidate Identical items
- Combo item Print Setting
  - Sequence Combo Name Prefix
  - Receipt & Check:
  - Kitchen:
  - Label:
  - Print Settings
    - Receipt & Check
      - Combo Name
      - Item Name
    - Kitchen
      - Combo Name
      - Item Name
    - Label
      - Combo Name
      - Item Name

### Void Reasons

- + Add Void Reason

### Report Settings

- Service Period
  - Service Period
    - Set service periods (or day parts) below to enable reports to compare one meal period to another. Please note that Service Periods must be assigned specific time ranges in the Weekly Schedule below before they can be used in reports for filtering.
  - Weekly Schedule
    - Configure weekly schedules to define when each service period is active throughout the week.
- POS Report
  - POS Report
    - The POS Report is a one-day sales summary available at any time in the POS system's Close Out Day or Service Report module.
    - Report Modules
      - Set up data fields and their ordering in the report display.
      - SALES & TAXES SUMMARY
      - PAYMENTS DETAILS
      - REFUND DETAILS
      - NET SALES BY CHANNEL
      - NET SALES BY CATEGORY
      - NET SALES BY SERVICE AREA
      - DISCOUNT SUMMARY
      - SERVER TIPOUTS
      - DELIVERY
      - TAX SUMMARY
      - VOID SUMMARY
      - FEE SUMMARY
      - Labor
      - DEPOSIT SUMMARY

### Online Presence

- View all web, app, and social links and QR codes for your store.
- Web
  - GMB Order Link
  - Website Link
- App
  - App Download QR Code
  - iOS App Store Link
  - Google Play Store Link
- Social Media Short URL
  - Connect your social profiles to Peblla online ordering. Use these links for Facebook/Yelp "Order" buttons and your Instagram/TikTok bio.

### Cash Drawer Settings

## Devices

### Printer

- 添加打印机
  - Robot
  - Receipt
    - * Name
    - * Printer Manufacturer
      - Gprinter
      - Rongta
      - Sunmi Printer
      - Star TSP100
      - Star mC-Print3
    - * Interface Type
      - USB
      - Interface Cable
    - * Paper Width
    - Buzzer on
  - Label
    - Add Label Printer
      - Name
      - Printer Manufacturer
      - * Interface Type
        - USB
        - Interface Cable
      - * Paper Width
        - 2.25*1.25 inch
      - * Label Print Orientation
        - Normal
        - Reverse
      - * Print Item With
        - Full Name
        - Alias Name
      - Print Scope
        - Print Item
        - Print Add-Ons
        - Print by Dining Type
  - Kitchen
    - Add Kitchen Printer
      - Print Scope
        - Print Item
          - All Items
          - Special Items
        - Print Add-Ons
          - All add-ons
          - Special add-ons
        - Print by Dining Type
          - All
          - Dine In
          - Take Out
          - Pick Up
          - Delivery
          - Phone Order
        - Split Print
          - No, print by order
          - Yes, print by individual item
        - Number of Order Times
      - * Name
      - * Printer Manufacturer
      - Interface Type
        - USB
        - Interface Cable
        - POS Inside
      - * Paper Width
        - 80 mm
      - Buzzer on
        - 1 Time
        - 3 Times
      - Print QR-Code
      - Print Item With
        - Full Name
        - Alias Name
    - Print Style
      - Default
      - Customize
        - Printer Name
        - Channels
        - Dining Type
          - Highlight
        - Order #
        - Payment Status
        - Item Split Line
        - Wrap Add-ons
        - Wrap Taste
        - Font Size
          - Small
          - Medium
          - Large
          - Extra Large
  - Pickup Ticket
    - Add Pickup Ticket Printer
      - Name
      - * Printer Manufacturer
      - * Interface Type
        - USB
        - Interface Cable
        - POS Inside
  - KDS
    - Add KDS
      - * Name
      - * Interface Type
        - Interface Cable
      - Print Item With
        - Full Name
        - Alias Name
      - Device SN
      - Fresh KDS Appid
      - Print Scope
        - Print Item
          - All Items
          - Special Items
        - Print Add-Ons
          - All add-ons
          - Special add-ons
        - Print by Dining Type
        - KDS Order Display Name
          - Default
          - Custom
            - Table:
              - Guest
              - First Name
              - Number of Order Times
              - Sequence ID
            - QSR / 3rd Order:
              - First Name
              - Future Order Tag
              - Channel
              - Pay Status
- 打印机列表
  - Name
  - Interface Type
  - Туре
  - Device Identifier
  - DHCP Status
  - Action

### Card Reader

- Name
- SN
- Reader Type
- Actions

### POS

- Counter POS List
  - Name
  - SN
  - Туре
  - Printers
  - Card Reader
  - Online
  - Actions

### POS Settings

- Set up the secondary screen display of the counter POS in the store, and support the configuration of videos and marketing activities.

### Kiosk

- Name
- SN
- Туре
- Card Reader
- Actions

### Kiosk Settings

- Theme Color Setting
- ADs Setting
  - Switching Time:
    - Media:
      - Able to upload videos or pictures
      - Picture: Support jpg, gif, jpeg, bmp, png format, the best resolution is 1080*1920 pixels. The size cannot exceed 3M
      - Video: Support mp4 format, the best ratio is 16:9, The size cannot exceed 50M
      - After saving, reboot the Kiosk to see the effect
    - Looking for the top image setup on the Kiosk ordering page? Please go to "Menu Details" for configuration.
- Voice Prompts
  - Start Order
  - Order Succeeded
  - Support MP3, M4A, AAC, OGG, WAV, FLAC, MIDI format.
  - The size cannot exceed 10M
- Contact Info Required
  - Select at least 1 option. (Phone, Name, or both)
  - Phone number
  - Customer name
- Order Location
  - Require table number
    - For dine-in table service. Not a contact method.
- Receipt Setting
  - Print Receipt
  - Notes for Cash Payment
- Text Message
- *Order SMS
  - Variable:Order numberEreceipt linkOrder pointUser balanceBalance Points ValueStore namePickup time
- Marketing SMS
  - Variable:Order numberEreceipt linkOrder pointUser balanceBalance Points ValueStore namePickup time
- Logo
- Ads
  - Support jpg, png, jpeg, bmp, webp format

## Store Account

### Payouts Details

- Overview
  - Stripe daily cutoff time at 03:00 AM
  - Total Balance
  - Future Payouts
  - In transit to bank
- Payouts
  - Amount
  - External account
  - Description
  - Statement Desc
  - Initiated
  - EST.Arrival
- Details
  - Payouts schedule
  - Payments
  - Bank accounts or debit cards

### Payouts Details

- Payouts Reconciliation
  - Initiated
  - EST. Arrival
  - Status
  - External Account
  - Description
  - Payout Total
  - Reconciliation Results

### Invoice

- Invoice List
  - Invoice #
  - Invoice Date
  - Type
  - Total
  - Status
  - Actions

### Disputes

- Customers may file disputes over transactions. We have integrated Stripe to handle these disputes, allowing you to respond promptly and provide evidence to minimize revenue loss.
- Needs Response
  - Number of ongoing disputes: 0
- Under Review
  - Number of ongoing disputes: 0
- Won
  - Number of ongoing disputes: 0
- Lost
  - Number of ongoing disputes: 0
- Closed
  - Number of ongoing disputes: 0
- 列表
  - Dispute ID
  - Amount
  - Stage
  - Status
  - Reason
  - Channel
  - Disputed On
  - No Data
  - Action

### Capture Time

- 12:00 AM
- Automatically captures authorized transactions from the previous business day at the scheduled time.

### Batch Close Time

- Batch Close Time Setting
  - Time Zone
  - America/New_York
  - Batch Close Time