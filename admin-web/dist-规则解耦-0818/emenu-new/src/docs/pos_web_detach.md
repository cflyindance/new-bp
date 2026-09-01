## POS后端项目webapp抽离计划（前后端独立）

### war包打包模块 (18.0.30-build)

1. cashdiscount => kpos/cashdiscount
   
   https://bitbucket.org/menusifu/cash-discount-frontend.git (v1.0.0)

2. portable => kpos/portable
   
   https://bitbucket.org/menusifu/portable-pos.git (production)
   
3. dist => kpos/dual/new
   
   https://bitbucket.org/menusifu/pos_cds.git (v2.7)

4. emenu => kpos/emenu
   
   https://bitbucket.org/menusifu/emenu-pro.git (v4.5.3)

5. front => kpos/front
   
   https://bitbucket.org/menusifu/pos_front.git (allinone_v18030)
   
6. v2 => kpos/front/v2
   
   https://bitbucket.org/menusifu/pos_front_v2.git (release/v1.2.0)

7. kiosklite => kpos/kiosklite
   
   https://bitbucket.org/menusifu/kiosklite.git (release/v3.4.0)

8. menu => kpos/menu
   
   https://bitbucket.org/menusifu/pos180-menu-configuration-frontend.git (v1.8.0.30)


另外：POS Main打包用到replacetimestamp.sh

---

### 网络加载分析（除front和接口，ws外的资源）

1. 首页：
   
   ![myhome](https://i.imgur.com/iQxY9rf.jpg)
  
2. 报表：

   ![report](https://i.imgur.com/qb3LWij.jpg)

3. 后台-员工管理：
   
   ![staff](https://i.imgur.com/e5XEpTi.png)

4. 后台-桌子：
   
   ![tables](https://i.imgur.com/mQllIDk.png)

5. 后台-图片库：
   
   ![gallery](https://i.imgur.com/2HmhTMn.png)

6. 后台-分析：
   
   ![report](https://i.imgur.com/uz4QRME.png)

---

7. 后台-菜单编辑：
   
   ![menu](https://i.imgur.com/2RAJ5Im.png)

8. 后台-调味指示：
   
   ![options](https://i.imgur.com/mWsYHHS.png)

9. 后台-菜品单位：
   
   ![itemSize](https://i.imgur.com/40SohR2.png)

10. 后台-菜序名：
    
    ![course](https://i.imgur.com/1fLZhJM.png)

11. 后台-促销策略：
   
    ![promotion](https://i.imgur.com/CFi0l7o.png)

12. 后台-按时计费：
   
    ![hourlyRate](https://i.imgur.com/tfKu8GW.png)

13. 后台-订单类型：
   
    ![orderType](https://i.imgur.com/0i3DDvW.png)

---

14. 后台-物品：
   
    ![inventoryItem](https://i.imgur.com/y6IzkKN.png)

15. 后台-渠道：
   
    ![inventoryInfo](https://i.imgur.com/K5tdPqY.png)

16. 后台-库存管理：
   
    ![inventoryMgmt](https://i.imgur.com/rLZCiKp.png)

---

17. 后台-税：
   
    ![tax](https://i.imgur.com/kINh79a.png)

18. 后台-折扣：
   
    ![discount](https://i.imgur.com/wLs6xc6.png)

19. 后台-付款类型：
   
    ![paymentAccount](https://i.imgur.com/QCIKcI6.png)

20. 后台-收银机；
   
    ![cashRegister](https://i.imgur.com/Dm9YcQ3.png)

---

21. 后台-设置：
   
    ![settings](https://i.imgur.com/DprxPcs.png)

22. 后台-打印机&设备：
   
    ![printers](https://i.imgur.com/TUEXzMk.png)

23. 后台-打印设置：
   
    ![printingSetup](https://i.imgur.com/eWemOXb.png)

24. 后台-多语言：
   
    ![language](https://i.imgur.com/c0LR7PG.png)

25. 后台-整合功能应用：
   
    ![partnerIntegration](https://i.imgur.com/gOzOhVb.png)

26. 后台-客显屏：
   
    ![cdssettings](https://i.imgur.com/EGt4zMQ.png)

---

27. 后台-礼品卡：
   
    ![giftCard](https://i.imgur.com/UfkGM9i.png)

28. 后台-会员卡：
   
    ![loyaltyCard](https://i.imgur.com/NsTdqm7.png)
    
29. 后台-顾客信息：
   
    ![customer](https://i.imgur.com/ZRkL43m.png)
    
30. *餐馆信息(company)，外送区域(deliveryArea)，加收(charge)* 已重构在`front/v2`中

---

* webapp下所有文件夹结构如下：
  
  ├── call
  ├── css
  ├── dual
  ├── emenu
  ├── front
  ├── images
  ├── js
  ├── kiosk
  ├── kiosklite
  ├── kitchen
  ├── langpkg
  ├── menu
  ├── portable
  ├── report
  └── waitlist
  
* 综上，webapp抽离后，需要保留除`company.html`，`deliveryArea.html`，`charge.html`的所有html文件，`replacetimestamp.sh`

* 下层文件夹中，`css`，`js`，`images`，`report`，`langpkg`文件夹必须保留，`front`，`emenu`，`kiosk`，`kiosklite`，`menu`，`portable`，`dual/new`文件夹使用独立模块打包，可删除

* `call`，`kitchen`，`waitlist`是其他尚未独立模块，保留

