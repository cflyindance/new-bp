# Toast结构分析（表格）

> 由列表结构展开：每行表示从「分组」到当前节点的一条路径；列对应层级。

| 层级1 | 层级2 | 层级3 | 层级4 | 层级5 | 层级6 | 层级7 | 层级8 |
|---|---|---|---|---|---|---|---|
| 分组一 |  |  |  |  |  |  |  |
| 分组一 | Home |  |  |  |  |  |  |
| 分组一 | Home | Quick actions |  |  |  |  |  |
| 分组一 | Home | Quick actions | Sales summary |  |  |  |  |
| 分组一 | Home | Quick actions | Labor summary |  |  |  |  |
| 分组一 | Home | Quick actions | Menu builder |  |  |  |  |
| 分组一 | Home | Quick actions | Menu manager |  |  |  |  |
| 分组一 | Home | Quick actions | Refund check |  |  |  |  |
| 分组一 | Home | Quick actions | O2 Employees |  |  |  |  |
| 分组一 | Home | Quick actions | Time entry |  |  |  |  |
| 分组一 | Home | Quick actions | management |  |  |  |  |
| 分组一 | Home | Quick actions | NEW FROM TOAST |  |  |  |  |
| 分组一 | Home | Quick actions | NEW FROM TOAST | Benchmarking |  |  |  |
| 分组一 | Home | Quick actions | NEW FROM TOAST | Instant deposit |  |  |  |
| 分组一 | Home | Quick actions | NEW FROM TOAST | Advertising |  |  |  |
| 分组一 | Home | Quick actions | NEW FROM TOAST | Credit Card Surcharge |  |  |  |
| 分组一 | Home | Quick actions | NEW FROM TOAST | Toast Checking |  |  |  |
| 分组一 | Home | Quick actions | NEW FROM TOAST | Device hub |  |  |  |
| 分组一 | Home | Net sales |  |  |  |  |  |
| 分组一 | Home | Net sales | Today |  |  |  |  |
| 分组一 | Home | Net sales | Yesterday |  |  |  |  |
| 分组一 | Home | Labor cost % of net sales |  |  |  |  |  |
| 分组一 | Home | Labor cost % of net sales | Today |  |  |  |  |
| 分组一 | Home | Labor cost % of net sales | Yesterday |  |  |  |  |
| 分组一 | Home | Discounts |  |  |  |  |  |
| 分组一 | Home | Discounts | Today |  |  |  |  |
| 分组一 | Home | Discounts | Yesterday |  |  |  |  |
| 分组一 | Home | Net sales by item |  |  |  |  |  |
| 分组一 | Home | Net sales by item | Item |  |  |  |  |
| 分组一 | Home | Net sales by item | Net sales |  |  |  |  |
| 分组一 | Home | Breakdown |  |  |  |  |  |
| 分组一 | Home | Breakdown | Time |  |  |  |  |
| 分组一 | Home | Breakdown | Net sales |  |  |  |  |
| 分组一 | Home | Breakdown | Labor cost |  |  |  |  |
| 分组一 | Home | Breakdown | Labor % |  |  |  |  |
| 分组一 | Home | Financial products |  |  |  |  |  |
| 分组一 | Home | Guest feedback |  |  |  |  |  |
| 分组一 | Home | Toast Online Ordering |  |  |  |  |  |
| 分组一 | Home | Impact |  |  |  |  |  |
| 分组一 | Home | Toast recommends |  |  |  |  |  |
| 分组一 | Reports |  |  |  |  |  |  |
| 分组一 | Reports | REPORTS |  |  |  |  |  |
| 分组一 | Reports | REPORTS | Benchmarking |  |  |  |  |
| 分组一 | Reports | REPORTS | Benchmarking | Benchmarking |  |  |  |
| 分组一 | Reports | REPORTS | Benchmarking | Menu insights |  |  |  |
| 分组一 | Reports | REPORTS | Benchmarking | Service insights |  |  |  |
| 分组一 | Reports | REPORTS | Benchmarking | Group overview |  |  |  |
| 分组一 | Reports | REPORTS | Projections |  |  |  |  |
| 分组一 | Reports | REPORTS | Projections | Sales projection |  |  |  |
| 分组一 | Reports | REPORTS | Projections | Daily breakdown |  |  |  |
| 分组一 | Reports | REPORTS | Sales |  |  |  |  |
| 分组一 | Reports | REPORTS | Sales | Sales summary |  |  |  |
| 分组一 | Reports | REPORTS | Sales | Sales analytics |  |  |  |
| 分组一 | Reports | REPORTS | Sales | Sales breakdown |  |  |  |
| 分组一 | Reports | REPORTS | Sales | Marketing-driven sales |  |  |  |
| 分组一 | Reports | REPORTS | Sales | Digital order sources |  |  |  |
| 分组一 | Reports | REPORTS | Sales | Orders |  |  |  |
| 分组一 | Reports | REPORTS | Sales | Order details |  |  |  |
| 分组一 | Reports | REPORTS | Sales | Paid in total |  |  |  |
| 分组一 | Reports | REPORTS | Sales | Deposit sales collected |  |  |  |
| 分组一 | Reports | REPORTS | Sales | Location breakdown |  |  |  |
| 分组一 | Reports | REPORTS | Sales | Group sales overview |  |  |  |
| 分组一 | Reports | REPORTS | Labor |  |  |  |  |
| 分组一 | Reports | REPORTS | Labor | Employee productivity |  |  |  |
| 分组一 | Reports | REPORTS | Labor | Labor summary |  |  |  |
| 分组一 | Reports | REPORTS | Labor | Labor cost breakdown |  |  |  |
| 分组一 | Reports | REPORTS | Labor | Time entry management |  |  |  |
| 分组一 | Reports | REPORTS | Labor | Time entry reporting |  |  |  |
| 分组一 | Reports | REPORTS | Labor | Time entry audits |  |  |  |
| 分组一 | Reports | REPORTS | Labor | Break entries |  |  |  |
| 分组一 | Reports | REPORTS | Labor | Break adherence |  |  |  |
| 分组一 | Reports | REPORTS | Labor | Hourly sales |  |  |  |
| 分组一 | Reports | REPORTS | Labor | Location overview |  |  |  |
| 分组一 | Reports | REPORTS | Labor | Shifts |  |  |  |
| 分组一 | Reports | REPORTS | Labor | Manager swipe card log |  |  |  |
| 分组一 | Reports | REPORTS | Labor | Pooled tips |  |  |  |
| 分组一 | Reports | REPORTS | Menus |  |  |  |  |
| 分组一 | Reports | REPORTS | Menus | Product mix |  |  |  |
| 分组一 | Reports | REPORTS | Menus | Upsell |  |  |  |
| 分组一 | Reports | REPORTS | Menus | performance |  |  |  |
| 分组一 | Reports | REPORTS | Menus | Top modifiers |  |  |  |
| 分组一 | Reports | REPORTS | Menus | Item details |  |  |  |
| 分组一 | Reports | REPORTS | Menus | Modifier details |  |  |  |
| 分组一 | Reports | REPORTS | Menus | 86 report |  |  |  |
| 分组一 | Reports | REPORTS | Menus | Food waste breakdown |  |  |  |
| 分组一 | Reports | REPORTS | Payments |  |  |  |  |
| 分组一 | Reports | REPORTS | Payments | Payments |  |  |  |
| 分组一 | Reports | REPORTS | Payments | Payout overview |  |  |  |
| 分组一 | Reports | REPORTS | Payments | Reconciliation |  |  |  |
| 分组一 | Reports | REPORTS | Payments | Processing statements |  |  |  |
| 分组一 | Reports | REPORTS | Payments | Chargebacks |  |  |  |
| 分组一 | Reports | REPORTS | Payments | Settled deposits daily |  |  |  |
| 分组一 | Reports | REPORTS | Payments | breakdown |  |  |  |
| 分组一 | Reports | REPORTS | Payments | Deposits total overview |  |  |  |
| 分组一 | Reports | REPORTS | Payments | Daily card activity |  |  |  |
| 分组一 | Reports | REPORTS | Payments | House accounts |  |  |  |
| 分组一 | Reports | REPORTS | Payments | transactions |  |  |  |
| 分组一 | Reports | REPORTS | Payments | Gift card balances |  |  |  |
| 分组一 | Reports | REPORTS | Payments | Inactive gift cards |  |  |  |
| 分组一 | Reports | REPORTS | Payments | Failed e-gift card delivery |  |  |  |
| 分组一 | Reports | REPORTS | Payments | Invoices |  |  |  |
| 分组一 | Reports | REPORTS | Cash & loss management |  |  |  |  |
| 分组一 | Reports | REPORTS | Cash & loss management | Cash activity audit |  |  |  |
| 分组一 | Reports | REPORTS | Cash & loss management | Cash drawer overview |  |  |  |
| 分组一 | Reports | REPORTS | Cash & loss management | Drawer history |  |  |  |
| 分组一 | Reports | REPORTS | Cash & loss management | Voided orders |  |  |  |
| 分组一 | Reports | REPORTS | Cash & loss management | Removed items |  |  |  |
| 分组一 | Reports | REPORTS | Cash & loss management | Loyalty Misuse |  |  |  |
| 分组一 | Reports | REPORTS | Cash & loss management | Discounts report |  |  |  |
| 分组一 | Reports | REPORTS | Cash & loss management | No sale |  |  |  |
| 分组一 | Reports | REPORTS | Cash & loss management | Unpaid orders |  |  |  |
| 分组一 | Reports | REPORTS | Cash & loss management | Refunds |  |  |  |
| 分组一 | Reports | REPORTS | Cash & loss management | Voided payments |  |  |  |
| 分组一 | Reports | REPORTS | Cash & loss management | Tax exempt |  |  |  |
| 分组一 | Reports | REPORTS | Cash & loss management | Offline payments |  |  |  |
| 分组一 | Reports | REPORTS | Cash & loss management | End of day |  |  |  |
| 分组一 | Reports | REPORTS | Cash & loss management | Check sequence log |  |  |  |
| 分组一 | Reports | REPORTS | Accounts |  |  |  |  |
| 分组一 | Reports | REPORTS | Accounts | Accounting overview |  |  |  |
| 分组一 | Reports | REPORTS | Accounts | Accounting by day |  |  |  |
| 分组一 | Reports | REPORTS | Accounts | Accounting by location |  |  |  |
| 分组一 | Reports | REPORTS | Accounts | General Ledger Accounts |  |  |  |
| 分组一 | Reports | REPORTS | Kitchen operations |  |  |  |  |
| 分组一 | Reports | REPORTS | Kitchen operations | Tickets by fulfillment |  |  |  |
| 分组一 | Reports | REPORTS | Kitchen operations | Tickets by hour |  |  |  |
| 分组一 | Reports | REPORTS | Kitchen operations | Ticket details |  |  |  |
| 分组一 | Reports | REPORTS | Kitchen operations | Kitchen overview |  |  |  |
| 分组一 | Reports | REPORTS | Marketing |  |  |  |  |
| 分组一 | Reports | REPORTS | Marketing | Guestbook |  |  |  |
| 分组一 | Reports | REPORTS | Marketing | Guest feedback |  |  |  |
| 分组一 | Reports | REPORTS | Marketing | Guest summary |  |  |  |
| 分组一 | Reports | REPORTS | Marketing | Guest credits |  |  |  |
| 分组一 | Reports | REPORTS | Marketing | Rewards accounts |  |  |  |
| 分组一 | Reports | REPORTS | Marketing | Rewards transactions |  |  |  |
| 分组一 | Reports | REPORTS | Marketing | Fundraising breakdown |  |  |  |
| 分组一 | Reports | REPORTS | Reservations & waitlist |  |  |  |  |
| 分组一 | Reports | REPORTS | Reservations & waitlist | Guests |  |  |  |
| 分组一 | Reports | REPORTS | Reservations & waitlist | Bookings |  |  |  |
| 分组一 | Reports | RELATED |  |  |  |  |  |
| 分组一 | Reports | RELATED | Settings |  |  |  |  |
| 分组一 | Reports | RELATED | Settings | Hours/services |  |  |  |
| 分组一 | Reports | RELATED | Settings | Data Exports |  |  |  |
| 分组一 | Reports | RELATED | Settings | SSH Keys |  |  |  |
| 分组一 | Discover products |  |  |  |  |  |  |
| 分组二 |  |  |  |  |  |  |  |
| 分组二 | Employees |  |  |  |  |  |  |
| 分组二 | Employees | Employee management |  |  |  |  |  |
| 分组二 | Employees | Employee management | Team overview |  |  |  |  |
| 分组二 | Employees | Employee management | Employees |  |  |  |  |
| 分组二 | Employees | Employee management | Employees | Add, edit, and archive employees. Manage employee permissions and passcodes. |  |  |  |
| 分组二 | Employees | Employee management | Jobs |  |  |  |  |
| 分组二 | Employees | Employee management | Sling Scheduling |  |  |  |  |
| 分组二 | Employees | Employee management | Sling Scheduling | Build employee schedules and communicate to your team with Sling |  |  |  |
| 分组二 | Employees | Employee management | Overtime rules |  |  |  |  |
| 分组二 | Employees | Employee management | Schedule enforcement |  |  |  |  |
| 分组二 | Employees | Employee management | Schedule enforcement | Manage the grace period allowed for shift clock in/out |  |  |  |
| 分组二 | Employees | Employee management | Hiring Labs: Easy hiring posters |  |  |  |  |
| 分组二 | Employees | Employee management | Hiring Labs: Easy hiring posters | Hire local candidates faster, with posters featuring QR Codes that make it a breeze to apply for jobs straight from a phone. Create your customized hiring poster in minutes! |  |  |  |
| 分组二 | Employees | Access management |  |  |  |  |  |
| 分组二 | Employees | Access management | Access management setup |  |  |  |  |
| 分组二 | Employees | Access management | Access management setup | Manage employee permissions based on the job |  |  |  |
| 分组二 | Employees | Payroll management |  |  |  |  |  |
| 分组二 | Employees | Payroll management | Toast Payroll |  |  |  |  |
| 分组二 | Employees | Payroll management | Toast Payroll | Manage employees, approve timesheets, and run payroll |  |  |  |
| 分组二 | Employees | Payroll management | Tip pooling policy |  |  |  |  |
| 分组二 | Employees | Payroll management | Tip pooling policy | Set up or edit your restaurant’s tip pooling policy |  |  |  |
| 分组二 | Employees | Payroll management | Tip withholding |  |  |  |  |
| 分组二 | Employees | Payroll management | Tip withholding | Reclaim credit card tips/gratuities to cover credit card processing fees |  |  |  |
| 分组二 | Employees | Shift review |  |  |  |  |  |
| 分组二 | Employees | Shift review | Shift review setup |  |  |  |  |
| 分组二 | Employees | Shift review | Shift review setup | Configure and customize your shift review experience |  |  |  |
| 分组二 | Employees | Shift review | Advanced shift review setup |  |  |  |  |
| 分组二 | Employees | Shift review | Advanced shift review setup | View and edit your shift review and report settings |  |  |  |
| 分组二 | Employees | POS report configurations |  |  |  |  |  |
| 分组二 | Employees | POS report configurations | Shift review report |  |  |  |  |
| 分组二 | Employees | POS report configurations | Shift review report | Configure what appears in the employee shift review report |  |  |  |
| 分组二 | Employees | POS report configurations | Manager end of day report |  |  |  |  |
| 分组二 | Employees | POS report configurations | Manager end of day report | Configure what appears in the manager end of day report |  |  |  |
| 分组二 | Employees | Timesheet management |  |  |  |  |  |
| 分组二 | Employees | Timesheet management | Time entry management |  |  |  |  |
| 分组二 | Employees | Timesheet management | Time entry management | View and edit your employees' time worked |  |  |  |
| 分组二 | Employees | Timesheet management | Time entry reporting |  |  |  |  |
| 分组二 | Employees | Timesheet management | Time entry reporting | Access time entries with pay information from over a year ago |  |  |  |
| 分组二 | Employees | Timesheet management | Break types |  |  |  |  |
| 分组二 | Employees | Related reports |  |  |  |  |  |
| 分组二 | Employees | Related reports | Employee productivity |  |  |  |  |
| 分组二 | Employees | Related reports | Employee productivity | Compare performance with top metrics |  |  |  |
| 分组二 | Employees | Related reports | Labor summary |  |  |  |  |
| 分组二 | Employees | Related reports | Labor summary | View hours worked, overtime, pay, and tips |  |  |  |
| 分组二 | Employees | Related reports | Manager swipe card log |  |  |  |  |
| 分组二 | Employees | Related reports | Shifts |  |  |  |  |
| 分组二 | Employees | Related reports | Shifts | Employee shifts, cash, and tips across locations |  |  |  |
| 分组二 | Employees | Related reports | Pooled tips |  |  |  |  |
| 分组二 | Employees | Related reports | Pooled tips | Track non-cash tips to distribute to employees based on hours worked |  |  |  |
| 分组二 | Employees | Related reports | Break entries |  |  |  |  |
| 分组二 | Employees | Related reports | Break entries | Manage all employee break entries, including meal/rest break violations and missed breaks |  |  |  |
| 分组二 | Employees | Related reports | Break adherence |  |  |  |  |
| 分组二 | Employees | Related reports | Break adherence | Monitor break time compliance in real time |  |  |  |
| 分组二 | Employees | Related reports | Time entry audits |  |  |  |  |
| 分组二 | Employees | Team Chat |  |  |  |  |  |
| 分组二 | Employees | Team Chat | Team Chat settings |  |  |  |  |
| 分组二 | Employees | Team Chat | Team Chat settings | View and edit team chat settings |  |  |  |
| 分组二 | Employees | Team Chat | Team Chat settings | Permissions |  |  |  |
| 分组二 | Employees | Team Chat | Team Chat settings | Permissions | Manage in-app chat settings for Sansan RaStreet |  |  |
| 分组二 | Employees | Team Chat | Team Chat settings | Permissions | Enable chat for all employees |  |  |
| 分组二 | Employees | Team Chat | Team Chat settings | Permissions | Allow anyone to start a chat |  |  |
| 分组二 | Payroll |  |  |  |  |  |  |
| 分组二 | Menus |  |  |  |  |  |  |
| 分组二 | Menus | Menu management |  |  |  |  |  |
| 分组二 | Menus | Menu management | Menu manager |  |  |  |  |
| 分组二 | Menus | Menu management | Menu manager | Build and manage your menu with improved flat lists of items, modifiers, and price levels. |  |  |  |
| 分组二 | Menus | Menu management | Menu builder |  |  |  |  |
| 分组二 | Menus | Menu management | Menu builder | Create and organize your menu from a single tool |  |  |  |
| 分组二 | Menus | Menu management | Edit menus |  |  |  |  |
| 分组二 | Menus | Menu management | Edit menus | Original menu editing pages that contain all advanced menu features. |  |  |  |
| 分组二 | Menus | Bulk management |  |  |  |  |  |
| 分组二 | Menus | Bulk management | Advanced properties |  |  |  |  |
| 分组二 | Menus | Bulk management | Advanced properties | View and edit all your menus on one screen |  |  |  |
| 分组二 | Menus | Bulk management | Price editor |  |  |  |  |
| 分组二 | Menus | Bulk management | Price editor | Edit menu group and item prices using the original price editor tool |  |  |  |
| 分组二 | Menus | Bulk management | Items database |  |  |  |  |
| 分组二 | Menus | Bulk management | Items database | View menus, menu groups, and menu items database. Search for archived menu items. |  |  |  |
| 分组二 | Menus | Settings |  |  |  |  |  |
| 分组二 | Menus | Settings | Open items |  |  |  |  |
| 分组二 | Menus | Settings | Open items | Ring up items or services that are not included in the menu |  |  |  |
| 分组二 | Menus | Settings | Sales categories |  |  |  |  |
| 分组二 | Menus | Settings | Sales categories | Define broad categories to track sales of related menu items |  |  |  |
| 分组二 | Menus | Settings | Item tags |  |  |  |  |
| 分组二 | Menus | Settings | Item tags | Define tags to track trends in similar menu items |  |  |  |
| 分组二 | Menus | Settings | Manage courses |  |  |  |  |
| 分组二 | Menus | Settings | Manage courses | Define courses to be used on menus, menu groups, or items |  |  |  |
| 分组二 | Menus | Settings | Pre modifiers |  |  |  |  |
| 分组二 | Menus | Settings | Pre modifiers | Add optional text before or after a modifier, like ADD, ON SIDE, or EXTRA |  |  |  |
| 分组二 | Menus | Settings | Price levels |  |  |  |  |
| 分组二 | Menus | Settings | Price levels | Define tiered pricing that can be applied to multiple menu items |  |  |  |
| 分组二 | Menus | Settings | Barcode config |  |  |  |  |
| 分组二 | Menus | Settings | Barcode config | Enable check digit on the amount is correct |  |  |  |
| 分组二 | Menus | Settings | Manage tax rates |  |  |  |  |
| 分组二 | Menus | Upsells |  |  |  |  |  |
| 分组二 | Menus | Upsells | Menu upsells |  |  |  |  |
| 分组二 | Menus | Upsells | Menu upsells | Create and manage upsell recommendations |  |  |  |
| 分组二 | Menus | Reports |  |  |  |  |  |
| 分组二 | Menus | Reports | Product mix |  |  |  |  |
| 分组二 | Menus | Reports | Product mix | Day-to-day breakdown of menu items sold |  |  |  |
| 分组二 | Menus | Reports | Item details |  |  |  |  |
| 分组二 | Menus | Reports | Item details | Detailed view of all menu items sold |  |  |  |
| 分组二 | Menus | Catering & Events management |  |  |  |  |  |
| 分组二 | Menus | Catering & Events management | Catering & Events |  |  |  |  |
| 分组二 | Menus | Catering & Events management | Catering & Events | Manage catering & events with custom BEOs, estimates, and lead management tools |  |  |  |
| 分组二 | Menus | Food waste management |  |  |  |  |  |
| 分组二 | Menus | Food waste management | Food waste tracker config |  |  |  |  |
| 分组二 | Menus | Food waste management | Food waste tracker config | Set up food waste reasons for your staff to start tracking |  |  |  |
| 分组二 | Menus | Food waste management | Food waste reporting |  |  |  |  |
| 分组二 | Menus | Food waste management | Food waste reporting | Track, understand, and manage trends in your food waste reduction management |  |  |  |
| 分组二 | Menus | Food waste management | Food waste education hub |  |  |  |  |
| 分组二 | Menus | Food waste management | Food waste education hub | Turn food waste insights into action with cost saving strategies |  |  |  |
| 分组二 | Takeout&delivery |  |  |  |  |  |  |
| 分组二 | Takeout&delivery | Toast online ordering |  |  |  |  |  |
| 分组二 | Takeout&delivery | Toast online ordering | Based on average monthly Online Ordering volume, assuming that customers pay 30% commission on third party ordering channels and switch all digital ordering volume to Toast. |  |  |  |  |
| 分组二 | Takeout&delivery | Toast online ordering | Restaurants can save up to $36K a year in commissions* by switching to Toast Online Ordering. Own your guest relationship and maintain your margins by allowing guests to easily order pickup or delivery directly from you – commission-free. |  |  |  |  |
| 分组二 | Takeout&delivery | Quote time strategy |  |  |  |  |  |
| 分组二 | Takeout&delivery | Quote time strategy | Quote times show guests when takeout and delivery orders will be ready. Quote times also control when orders are fired to the kitchen. |  |  |  |  |
| 分组二 | Takeout&delivery | Quote time strategy | Takeout |  |  |  |  |
| 分组二 | Takeout&delivery | Quote time strategy | Takeout | 1 h |  |  |  |
| 分组二 | Takeout&delivery | Quote time strategy | Takeout | 1 h | 10 min |  |  |
| 分组二 | Takeout&delivery | Third-party ordering |  |  |  |  |  |
| 分组二 | Takeout&delivery | Third-party ordering | Reach more guests and ditch the tablets, all while reducing labor costs and order errors. No more double entry. |  |  |  |  |
| 分组二 | Takeout&delivery | Online ordering hours |  |  |  |  |  |
| 分组二 | Takeout&delivery | Online ordering hours | Set your online ordering hours for takeout and delivery. Toast Online Ordering, Toast Delivery Services, Grubhub, DoorDash, and Uber Eats use your Takeout & Third-party delivery hours. First-party deliveries use your First-party delivery hours. |  |  |  |  |
| 分组二 | Takeout&delivery | Online ordering hours | Takeout & Third-party delivery |  |  |  |  |
| 分组二 | Takeout&delivery | Online ordering hours | Takeout & Third-party delivery | Mon |  |  |  |
| 分组二 | Takeout&delivery | Online ordering hours | Takeout & Third-party delivery | Tue |  |  |  |
| 分组二 | Takeout&delivery | Online ordering hours | Takeout & Third-party delivery | Wed |  |  |  |
| 分组二 | Takeout&delivery | Online ordering hours | Takeout & Third-party delivery | Thu |  |  |  |
| 分组二 | Takeout&delivery | Online ordering hours | Takeout & Third-party delivery | Fri |  |  |  |
| 分组二 | Takeout&delivery | Online ordering hours | Takeout & Third-party delivery | Sat |  |  |  |
| 分组二 | Takeout&delivery | Online ordering hours | Takeout & Third-party delivery | Sun |  |  |  |
| 分组二 | Takeout&delivery | Online ordering hours | Accept orders until |  |  |  |  |
| 分组二 | Takeout&delivery | Online ordering hours | Accept orders until | Closing time minus prep time |  |  |  |
| 分组二 | Takeout&delivery | Online ordering hours | Accept orders until | Closing time |  |  |  |
| 分组二 | Takeout&delivery | Online ordering hours | Overrides |  |  |  |  |
| 分组二 | Takeout&delivery | Online ordering hours | Overrides | Customize your hours on specific days for takeout and/or delivery. This only affects online ordering. Hours must be in increments of 15 minutes. |  |  |  |
| 分组二 | Takeout&delivery | Availability |  |  |  |  |  |
| 分组二 | Takeout&delivery | Availability | Online Ordering |  |  |  |  |
| 分组二 | Takeout&delivery | Availability | Online Ordering | Enable online ordering and customize approval rules, payment methods and more |  |  |  |
| 分组二 | Takeout&delivery | Availability | Takeout/delivery |  |  |  |  |
| 分组二 | Takeout&delivery | Availability | Takeout/delivery | Manage takeout and delivery, including throttling and delivery range |  |  |  |
| 分组二 | Takeout&delivery | Availability | Prep/delivery times |  |  |  |  |
| 分组二 | Takeout&delivery | Availability | Prep/delivery times | Control guest facing quote times for Online Ordering |  |  |  |
| 分组二 | Takeout&delivery | Packaging preferences |  |  |  |  |  |
| 分组二 | Takeout&delivery | Packaging preferences | Packaging preferences |  |  |  |  |
| 分组二 | Takeout&delivery | Packaging preferences | Packaging preferences | Specify to your guests what default single-use items will be included in Takeout & delivery |  |  |  |
| 分组二 | Takeout&delivery | Toast Delivery Services |  |  |  |  |  |
| 分组二 | Takeout&delivery | Toast Delivery Services | Activate Toast Delivery Services |  |  |  |  |
| 分组二 | Takeout&delivery | Toast Delivery Services | Activate Toast Delivery Services | Activate Toast Delivery Services to allow your guests to order delivery directly from your restaurant on your Toast Online Ordering channels |  |  |  |
| 分组二 | Takeout&delivery | Order ready board |  |  |  |  |  |
| 分组二 | Takeout&delivery | Order ready board | Order ready board settings |  |  |  |  |
| 分组二 | Takeout&delivery | Order ready board | Order ready board settings | Displays order statuses on a screen located in a restaurant |  |  |  |
| 分组二 | Takeout&delivery | Orders Hub |  |  |  |  |  |
| 分组二 | Takeout&delivery | Orders Hub | Order ready guest messaging |  |  |  |  |
| 分组二 | Takeout&delivery | Orders Hub | Order ready guest messaging | Send guests a text message when their order is marked Order Ready |  |  |  |
| 分组二 | Takeout&delivery | Toast order sources |  |  |  |  |  |
| 分组二 | Takeout&delivery | Toast order sources | Restaurant info |  |  |  |  |
| 分组二 | Takeout&delivery | Toast order sources | Restaurant info | Customize your branding and restaurant info seen by guests on your website, gift cards, and social media |  |  |  |
| 分组二 | Takeout&delivery | Offers |  |  |  |  |  |
| 分组二 | Takeout&delivery | Offers | Create offers |  |  |  |  |
| 分组二 | Takeout&delivery | Offers | Create offers | Choose from pre-set offers designed to help you grow your sales |  |  |  |
| 分组二 | Takeout&delivery | Offers | Manage offers |  |  |  |  |
| 分组二 | Takeout&delivery | Offers | Manage offers | View and compare performance from active and expired offers |  |  |  |
| 分组二 | Takeout&delivery | Fundraising campaigns |  |  |  |  |  |
| 分组二 | Takeout&delivery | Fundraising campaigns | Create a fundraising campaign |  |  |  |  |
| 分组二 | Takeout&delivery | Fundraising campaigns | Create a fundraising campaign | Add a cause and collect contributions from guests in supported ordering channels. |  |  |  |
| 分组二 | Takeout&delivery | Related reports |  |  |  |  |  |
| 分组二 | Takeout&delivery | Related reports | Sales summary |  |  |  |  |
| 分组二 | Takeout&delivery | Related reports | Sales summary | Day-to-day top numbers for sales, payments, sales categories, cash and more |  |  |  |
| 分组二 | Takeout&delivery | Related reports | Sales analytics |  |  |  |  |
| 分组二 | Takeout&delivery | Related reports | Sales analytics | Historical sales trends and top numbers |  |  |  |
| 分组二 | Catering & events |  |  |  |  |  |  |
| 分组二 | Catering & events | Overview |  |  |  |  |  |
| 分组二 | Catering & events | Leads |  |  |  |  |  |
| 分组二 | Catering & events | Orders |  |  |  |  |  |
| 分组二 | Catering & events | Orders | Customer |  |  |  |  |
| 分组二 | Catering & events | Orders | Amount |  |  |  |  |
| 分组二 | Catering & events | Orders | Type |  |  |  |  |
| 分组二 | Catering & events | Orders | Status |  |  |  |  |
| 分组二 | Catering & events | Orders | Number |  |  |  |  |
| 分组二 | Catering & events | Orders | Paid |  |  |  |  |
| 分组二 | Catering & events | Orders | Dining option |  |  |  |  |
| 分组二 | Catering & events | Orders | Created from |  |  |  |  |
| 分组二 | Catering & events | Orders | Company |  |  |  |  |
| 分组二 | Catering & events | Orders | Location name |  |  |  |  |
| 分组二 | Catering & events | Orders | Created date |  |  |  |  |
| 分组二 | Catering & events | Invoices |  |  |  |  |  |
| 分组二 | Catering & events | Invoices | Amount |  |  |  |  |
| 分组二 | Catering & events | Invoices | Status |  |  |  |  |
| 分组二 | Catering & events | Invoices | Number |  |  |  |  |
| 分组二 | Catering & events | Invoices | Customer |  |  |  |  |
| 分组二 | Catering & events | Invoices | Company |  |  |  |  |
| 分组二 | Catering & events | Invoices | Location name |  |  |  |  |
| 分组二 | Catering & events | Invoices | Created date |  |  |  |  |
| 分组二 | Catering & events | Invoices | Order date |  |  |  |  |
| 分组二 | Catering & events | Calendar |  |  |  |  |  |
| 分组二 | Catering & events | Prep tools |  |  |  |  |  |
| 分组二 | Catering & events | Prep tools | Custom |  |  |  |  |
| 分组二 | Catering & events | Prep tools | Custom | Start creating prep tools |  |  |  |
| 分组二 | Catering & events | Prep tools | Custom | Download and print order information to assist in preparing orders. Save go-to prep tools for future use or run new ones on the fly. |  |  |  |
| 分组二 | Catering & events | Prep tools | Standard |  |  |  |  |
| 分组二 | Catering & events | Prep tools | Standard | Prep list |  |  |  |
| 分组二 | Catering & events | Prep tools | Standard | Prep list | Items and modifiers with quantities |  |  |
| 分组二 | Catering & events | Prep tools | Standard | Invoice |  |  |  |
| 分组二 | Catering & events | Prep tools | Standard | Invoice | Customer info, menu items, prices, and modifiers |  |  |
| 分组二 | Catering & events | Prep tools | Standard | Banquet event order (BEO) |  |  |  |
| 分组二 | Catering & events | Prep tools | Standard | Banquet event order (BEO) | Customer info, all fields, internal notes, menu items, and modifiers |  |  |
| 分组二 | Catering & events | Prep tools | Standard | Kitchen sheet |  |  |  |
| 分组二 | Catering & events | Prep tools | Standard | Kitchen sheet | Customer name, selected fields, internal notes, menu items, and modifiers |  |  |
| 分组二 | Catering & events | Prep tools | Standard | Pickup summary |  |  |  |
| 分组二 | Catering & events | Prep tools | Standard | Pickup summary | Pickup orders by time, status, tip amount, and form fields |  |  |
| 分组二 | Catering & events | Prep tools | Standard | Delivery summary |  |  |  |
| 分组二 | Catering & events | Prep tools | Standard | Delivery summary | Delivery orders by time, status, tip amount, form fields, driver, and address |  |  |
| 分组二 | Catering & events | Prep tools | Standard | Pack sheet |  |  |  |
| 分组二 | Catering & events | Prep tools | Standard | Pack sheet | Items and modifiers by customer and prep station |  |  |
| 分组二 | Catering & events | Prep tools | Standard | Order summary |  |  |  |
| 分组二 | Catering & events | Prep tools | Standard | Order summary | Orders by date and time with customer info, items, quantities, and modifiers |  |  |
| 分组二 | Catering & events | Prep tools | Standard | CSV export |  |  |  |
| 分组二 | Catering & events | Prep tools | Standard | CSV export | Order, item, and modifier data in a .csv format |  |  |
| 分组二 | Catering & events | Prep tools | Standard | Labels |  |  |  |
| 分组二 | Catering & events | Prep tools | Standard | Labels | 2" x 4" labels (10 per sheet) for orders, items, and modifiers |  |  |
| 分组二 | Catering & events | Customers |  |  |  |  |  |
| 分组二 | Catering & events | Customers | Name |  |  |  |  |
| 分组二 | Catering & events | Customers | Company |  |  |  |  |
| 分组二 | Catering & events | Customers | Total spend |  |  |  |  |
| 分组二 | Catering & events | Customers | Outstanding balance |  |  |  |  |
| 分组二 | Catering & events | Customers | Last order |  |  |  |  |
| 分组二 | Catering & events | Settings |  |  |  |  |  |
| 分组二 | Catering & events | Settings | Order types |  |  |  |  |
| 分组二 | Catering & events | Settings | Event settings |  |  |  |  |
| 分组二 | Catering & events | Settings | Location picker |  |  |  |  |
| 分组二 | Catering & events | Settings | Toast Local |  |  |  |  |
| 分组二 | Catering & events | Settings | Toast Delivery Services |  |  |  |  |
| 分组二 | Catering & events | Settings | Notifications |  |  |  |  |
| 分组二 | Catering & events | Settings | Order & Invoice settings |  |  |  |  |
| 分组二 | Catering & events | Settings | Invoice settings |  |  |  |  |
| 分组二 | Catering & events | Settings | Branding |  |  |  |  |
| 分组二 | Catering & events | Settings | Additional orders |  |  |  |  |
| 分组二 | Catering & events | Online ordering |  |  |  |  |  |
| 分组二 | Catering & events | Online ordering | General |  |  |  |  |
| 分组二 | Catering & events | Online ordering | General | Online ordering enabled |  |  |  |
| 分组二 | Catering & events | Online ordering | General | Online ordering enabled | Allow guests to place catering orders online. Online ordering will remain on until manually turned off. |  |  |
| 分组二 | Catering & events | Online ordering | General | Spotlight feature |  |  |  |
| 分组二 | Catering & events | Online ordering | General | Spotlight feature | Show banner message at the top of the catering online ordering page. |  |  |
| 分组二 | Catering & events | Online ordering | General | Spotlight content |  |  |  |
| 分组二 | Catering & events | Online ordering | Schedule |  |  |  |  |
| 分组二 | Catering & events | Online ordering | Schedule | Customize your catering hours below to apply to only your catering site. This will not affect your regular restaurant hours. |  |  |  |
| 分组二 | Catering & events | Online ordering | Schedule | Takeout |  |  |  |
| 分组二 | Catering & events | Online ordering | Schedule | Delivery |  |  |  |
| 分组二 | Catering & events | Online ordering | Schedule | Overrides |  |  |  |
| 分组二 | Catering & events | Online ordering | Schedule | Overrides | Customize your hours on specific days for catering takeout and/or delivery. This only affects catering online ordering. Hours must be in increments of 15 minutes. |  |  |
| 分组二 | Catering & events | Online ordering | Order setup |  |  |  |  |
| 分组二 | Catering & events | Online ordering | Order setup | Default server |  |  |  |
| 分组二 | Catering & events | Online ordering | Order setup | Default server | Servers are assigned tips for the event. It’s common in catering to use a "tip pool" employee so you can divide tips on payroll easily. If you select a default server, tips will be on by default. |  |  |
| 分组二 | Catering & events | Online ordering | Order setup | Reporting |  |  |  |
| 分组二 | Catering & events | Online ordering | Order setup | Reporting | Associate your catering online orders with a revenue center to be able to report on volume from this segment of your business. Revenue centers can be added and configured here. |  |  |
| 分组二 | Catering & events | Online ordering | Order setup | Reporting | Revenue center |  |  |
| 分组二 | Catering & events | Online ordering | Order setup | Special requests |  |  |  |
| 分组二 | Catering & events | Online ordering | Order setup | Special requests | Allow special requests when guests add items to their cart. |  |  |
| 分组二 | Catering & events | Online ordering | Order setup | Special requests message |  |  |  |
| 分组二 | Catering & events | Online ordering | Takeout setup |  |  |  |  |
| 分组二 | Catering & events | Online ordering | Takeout setup | Takeout |  |  |  |
| 分组二 | Catering & events | Online ordering | Takeout setup | Takeout | Allow guests to place catering takeout orders online. |  |  |
| 分组二 | Catering & events | Online ordering | Takeout setup | Order type |  |  |  |
| 分组二 | Catering & events | Online ordering | Takeout setup | Order type | Fields at checkout & notification settings are based on the order type selected. You can edit and order types within settings. |  |  |
| 分组二 | Catering & events | Online ordering | Takeout setup | Dining option |  |  |  |
| 分组二 | Catering & events | Online ordering | Takeout setup | Dining option | Select a dining option |  |  |
| 分组二 | Catering & events | Online ordering | Takeout setup | When can guests place orders? (Lead time & max days ahead) |  |  |  |
| 分组二 | Catering & events | Online ordering | Takeout setup | When can guests place orders? (Lead time & max days ahead) | ASAP - 14 days ahead |  |  |
| 分组二 | Catering & events | Online ordering | Takeout setup | Prep time |  |  |  |
| 分组二 | Catering & events | Online ordering | Takeout setup | Prep time | Takeout orders will fire 1 hour 10 minutes before due time |  |  |
| 分组二 | Catering & events | Online ordering | Takeout setup | Min & max order amount |  |  |  |
| 分组二 | Catering & events | Online ordering | Takeout setup | Min & max order amount | Set a minimum and/or maximum amount per takeout order |  |  |
| 分组二 | Catering & events | Online ordering | Takeout setup | Tipping |  |  |  |
| 分组二 | Catering & events | Online ordering | Takeout setup | Tipping | Allow customers to add a tip when placing a takeout order. |  |  |
| 分组二 | Catering & events | Online ordering | Takeout setup | Custom tip percentages |  |  |  |
| 分组二 | Catering & events | Online ordering | Takeout setup | Default tip percentage |  |  |  |
| 分组二 | Catering & events | Online ordering | Takeout setup | Takeout time intervals |  |  |  |
| 分组二 | Catering & events | Online ordering | Takeout setup | Takeout time intervals | Guests can select a takeout time every 15 minutes (ex: 9:00 AM, 9:15 AM, 9:30 AM) |  |  |
| 分组二 | Catering & events | Online ordering | Delivery setup |  |  |  |  |
| 分组二 | Catering & events | Online ordering | Service charges |  |  |  |  |
| 分组二 | Catering & events | Online ordering | Checkout experience |  |  |  |  |
| 分组二 | Catering & events | Online ordering | Menu management |  |  |  |  |
| 分组二 | Catering & events | Online ordering | Special menus |  |  |  |  |
| 分组二 | Catering & events | Online ordering | Catering capacity |  |  |  |  |
| 分组二 | Payments |  |  |  |  |  |  |
| 分组二 | Payments | Transactions & refunds |  |  |  |  |  |
| 分组二 | Payments | Transactions & refunds | Find checks & issue refund |  |  |  |  |
| 分组二 | Payments | Transactions & refunds | Find checks & issue refund | Use this page to search for orders, check refund eligibility, issue refunds, and retrieve receipts as needed. |  |  |  |
| 分组二 | Payments | Transactions & refunds | Chargeback challenger |  |  |  |  |
| 分组二 | Payments | Transactions & refunds | Issue unlinked refund |  |  |  |  |
| 分组二 | Payments | Transactions & refunds | Issue unlinked refund | Submit a refund to a credit card without having to associate it with a check |  |  |  |
| 分组二 | Payments | Transactions & refunds | Void reasons |  |  |  |  |
| 分组二 | Payments | Transactions & refunds | No sale reasons |  |  |  |  |
| 分组二 | Payments | Transactions & refunds | Pay Out Reasons |  |  |  |  |
| 分组二 | Payments | Instant deposit |  |  |  |  |  |
| 分组二 | Payments | Instant deposit | Instant deposit |  |  |  |  |
| 分组二 | Payments | Instant deposit | Instant deposit | Get access to your current closed sales within 30 minutes for a fee |  |  |  |
| 分组二 | Payments | Auto-close orders at end of day |  |  |  |  |  |
| 分组二 | Payments | Auto-close orders at end of day | Auto-close orders at end of day |  |  |  |  |
| 分组二 | Payments | Auto-close orders at end of day | Auto-close orders at end of day | At the end of the store’s business day, handle eligible open orders by either automatically closing them with a dedicated system payment type (“Auto-Close”), or voiding them |  |  |  |
| 分组二 | Payments | Toast Checking |  |  |  |  |  |
| 分组二 | Payments | Toast Checking | Take control of your cash with a Toast Checking account |  |  |  |  |
| 分组二 | Payments | Toast Checking | Take control of your cash with a Toast Checking account | Start banking with no monthly fees. Automatically budget with specialized accounts, build savings, and spend with a debit card. Plus, earn high-yield interest on your hard-earned cash. |  |  |  |
| 分组二 | Payments | Payment methods |  |  |  |  |  |
| 分组二 | Payments | Payment methods | Payment options |  |  |  |  |
| 分组二 | Payments | Payment methods | Payment options | Customize guest payment experience, including pre-auth, tipping, processing, and digital receipts |  |  |  |
| 分组二 | Payments | Payment methods | Other payment options |  |  |  |  |
| 分组二 | Payments | Payment methods | Other payment options | Accept alternative payment methods like paper gift cards or 3rd party offers |  |  |  |
| 分组二 | Payments | Payment methods | Toast Pay |  |  |  |  |
| 分组二 | Payments | Payment methods | Toast Pay | Customize your QR code payments experience, review your tip, logo, and notification settings. |  |  |  |
| 分组二 | Payments | Payment methods | EBT payments |  |  |  |  |
| 分组二 | Payments | Payment methods | EBT payments | Accept Electronic Benefits Transfer (EBT) payments for eligible food items, offering a seamless payment experience for customers using SNAP benefits. |  |  |  |
| 分组二 | Payments | Payment methods | House accounts |  |  |  |  |
| 分组二 | Payments | Payment methods | House accounts | Manage deferring payment over a billing cycle and send invoices |  |  |  |
| 分组二 | Payments | Payment methods | Customer invoices |  |  |  |  |
| 分组二 | Payments | Payment methods | Customer invoices | Create and send invoices for orders that customers can pay online |  |  |  |
| 分组二 | Payments | Payment methods | Customer credits |  |  |  |  |
| 分组二 | Payments | Payment methods | Customer credits | Offer credits that can be applied to future orders |  |  |  |
| 分组二 | Payments | Payment methods | Cash overview |  |  |  |  |
| 分组二 | Payments | Payment methods | Cash overview | Control all configs relating to cash, cash drawers, and cash management |  |  |  |
| 分组二 | Payments | Payment methods | Gift cards |  |  |  |  |
| 分组二 | Payments | Payment methods | Gift cards | Manage gift card setup, reporting, and ordering |  |  |  |
| 分组二 | Payments | Credit card surcharging |  |  |  |  |  |
| 分组二 | Payments | Credit card surcharging | Set up and manage credit card surcharging |  |  |  |  |
| 分组二 | Payments | Credit card surcharging | Set up and manage credit card surcharging | Use our automated, compliant solution to surcharge credit cards. |  |  |  |
| 分组二 | Payments | Checks & receipt setup |  |  |  |  |  |
| 分组二 | Payments | Checks & receipt setup | Service charges and fees |  |  |  |  |
| 分组二 | Payments | Checks & receipt setup | Service charges and fees | Require additional fees like gratuity, delivery or event charges |  |  |  |
| 分组二 | Payments | Checks & receipt setup | Printers and cash drawers |  |  |  |  |
| 分组二 | Payments | Checks & receipt setup | Printers and cash drawers | Setup and manage printers and cash drawer |  |  |  |
| 分组二 | Payments | Checks & receipt setup | Guest display |  |  |  |  |
| 分组二 | Payments | Comps and promos |  |  |  |  |  |
| 分组二 | Payments | Comps and promos | Discounts and promo codes |  |  |  |  |
| 分组二 | Payments | Comps and promos | Discounts and promo codes | Manage discounts & comps, including availability, applicable menu items and more |  |  |  |
| 分组二 | Payments | Comps and promos | Create & manage offers |  |  |  |  |
| 分组二 | Payments | Comps and promos | Create & manage offers | Create and track promotional offers based on pre-set recommendations designed to help grow your sales |  |  |  |
| 分组二 | Payments | Comps and promos | Discount and food waste reasons |  |  |  |  |
| 分组二 | Payments | Gift cards |  |  |  |  |  |
| 分组二 | Payments | Gift cards | Gift card setup |  |  |  |  |
| 分组二 | Payments | Gift cards | Gift card setup | Set up gift cards and request or disable gift card integration. Find link to purchase or look up gift cards. |  |  |  |
| 分组二 | Payments | Gift cards | Transfer gift cards |  |  |  |  |
| 分组二 | Payments | Gift cards | Transfer gift cards | Transfer gift card and reward balances. |  |  |  |
| 分组二 | Payments | Related reports |  |  |  |  |  |
| 分组二 | Payments | Related reports | Sales summary |  |  |  |  |
| 分组二 | Payments | Related reports | Sales summary | Day-to-day top numbers for sales, payments, sales categories, cash and more |  |  |  |
| 分组二 | Payments | Related reports | Cash activity audit |  |  |  |  |
| 分组二 | Payments | Related reports | Cash activity audit | All cash drawer activity over time for a selected location |  |  |  |
| 分组二 | Payments | Related reports | Payments |  |  |  |  |
| 分组二 | Payments | Related reports | Payments | All payment activity across locations |  |  |  |
| 分组二 | Financial products |  |  |  |  |  |  |
| 分组二 | Financial products | Overview |  |  |  |  |  |
| 分组二 | Financial products | FINANCE |  |  |  |  |  |
| 分组二 | Financial products | FINANCE | Toast Checking |  |  |  |  |
| 分组二 | Financial products | FINANCE | Toast Capital Loan |  |  |  |  |
| 分组二 | Financial products | FINANCE | Toast Capital Loan | Remaining balance |  |  |  |
| 分组二 | Financial products | FINANCE | Toast Capital Loan | Amount repaid |  |  |  |
| 分组二 | Financial products | FINANCE | Toast Capital Loan | Repayment method |  |  |  |
| 分组二 | Financial products | FINANCE | Toast Capital Loan | Target repayment date |  |  |  |
| 分组二 | Financial products | FINANCE | Cash Flow Insights |  |  |  |  |
| 分组二 | Financial products | FINANCE | Cash Flow Insights | Cash flow overview |  |  |  |
| 分组二 | Financial products | FINANCE | Cash Flow Insights | Operating cash flow |  |  |  |
| 分组二 | Financial products | FINANCE | Cash Flow Insights | Inflow by source |  |  |  |
| 分组二 | Financial products | FINANCE | Cash Flow Insights | Outflow by |  |  |  |
| 分组二 | Financial products | FINANCE | Insurance |  |  |  |  |
| 分组二 | Financial products | FINANCE | Hardware leasing |  |  |  |  |
| 分组二 | Financial products | ACCOUNTING |  |  |  |  |  |
| 分组二 | Financial products | ACCOUNTING | Activity |  |  |  |  |
| 分组二 | Financial products | ACCOUNTING | Payroll assignments |  |  |  |  |
| 分组二 | Financial products | ACCOUNTING | Connections |  |  |  |  |
| 分组二 | Financial products | ACCOUNTING | Payroll settings |  |  |  |  |
| 分组二 | Financial products | RELATED |  |  |  |  |  |
| 分组二 | Financial products | RELATED | Reports |  |  |  |  |
| 分组二 | Financial products | RELATED | Reports | Payments |  |  |  |
| 分组二 | Financial products | RELATED | Reports | Payout overview |  |  |  |
| 分组二 | Financial products | RELATED | Reports | Reconciliation |  |  |  |
| 分组二 | Financial products | RELATED | Reports | Processing statements |  |  |  |
| 分组二 | Guests |  |  |  |  |  |  |
| 分组二 | Guests | Overview |  |  |  |  |  |
| 分组二 | Guests | Overview | All guests |  |  |  |  |
| 分组二 | Guests | Overview | Email subscribers |  |  |  |  |
| 分组二 | Guests | Overview | SMS subscribers |  |  |  |  |
| 分组二 | Guests | Overview | Your guest tools |  |  |  |  |
| 分组二 | Guests | Overview | Your guest tools | Guestbook |  |  |  |
| 分组二 | Guests | Overview | Your guest tools | Guestbook | Find, filter, and manage all your guests in one place |  |  |
| 分组二 | Guests | Overview | Your guest tools | Guest insights |  |  |  |
| 分组二 | Guests | Overview | Your guest tools | Guest insights | Explore trends and behaviors across all guests |  |  |
| 分组二 | Guests | Overview | Your guest tools | Feedback inbox |  |  |  |
| 分组二 | Guests | Overview | Your guest tools | Feedback inbox | Review and respond to priority guest feedback |  |  |
| 分组二 | Guests | Overview | Your guest tools | Feedback insights |  |  |  |
| 分组二 | Guests | Overview | Your guest tools | Feedback insights | Uncover what's working and where to improve |  |  |
| 分组二 | Guests | GUESTS |  |  |  |  |  |
| 分组二 | Guests | GUESTS | Guestbook |  |  |  |  |
| 分组二 | Guests | GUESTS | Guestbook | All guests |  |  |  |
| 分组二 | Guests | GUESTS | Guestbook | All guests | Contact |  |  |
| 分组二 | Guests | GUESTS | Guestbook | All guests | Last order |  |  |
| 分组二 | Guests | GUESTS | Guestbook | All guests | Number of orders |  |  |
| 分组二 | Guests | GUESTS | Guestbook | All guests | Lifetime spend |  |  |
| 分组二 | Guests | GUESTS | Guestbook | All guests | Tags |  |  |
| 分组二 | Guests | GUESTS | Guestbook | Email subscribers |  |  |  |
| 分组二 | Guests | GUESTS | Guestbook | Email subscribers | Contact |  |  |
| 分组二 | Guests | GUESTS | Guestbook | Email subscribers | Last order |  |  |
| 分组二 | Guests | GUESTS | Guestbook | Email subscribers | Number of orders |  |  |
| 分组二 | Guests | GUESTS | Guestbook | Email subscribers | Lifetime spend |  |  |
| 分组二 | Guests | GUESTS | Guestbook | Email subscribers | Tags |  |  |
| 分组二 | Guests | GUESTS | Guestbook | SMS subscribers |  |  |  |
| 分组二 | Guests | GUESTS | Guest segments |  |  |  |  |
| 分组二 | Guests | GUESTS | Guest insights |  |  |  |  |
| 分组二 | Guests | FEEDBACK |  |  |  |  |  |
| 分组二 | Guests | FEEDBACK | Feedback inbox |  |  |  |  |
| 分组二 | Guests | FEEDBACK | Feedback insights |  |  |  |  |
| 分组二 | Guests | FEEDBACK | Menu item feedback |  |  |  |  |
| 分组二 | Guests | RELATED |  |  |  |  |  |
| 分组二 | Guests | RELATED | Reports |  |  |  |  |
| 分组二 | Guests | RELATED | Reports | Guest feedback |  |  |  |
| 分组二 | Guests | RELATED | Reports | Guest summary |  |  |  |
| 分组二 | Guests | RELATED | Reports | Guest credits |  |  |  |
| 分组二 | Guests | RELATED | Reports | Rewards accounts |  |  |  |
| 分组二 | Guests | RELATED | Settings |  |  |  |  |
| 分组二 | Guests | RELATED | Settings | Guest feedback settings |  |  |  |
| 分组二 | Guests | RELATED | Settings | Guest feedback settings | Enable Guest Feedback |  |  |
| 分组二 | Guests | RELATED | Settings | Guest feedback settings | Enable Guest Feedback | Click the following Toast Central link to learn more about how to configure new Guest Feedback at your restaurant: Toast Central |  |
| 分组二 | Guests | RELATED | Settings | Guest feedback settings | Share your Guest Feedback page |  |  |
| 分组二 | Guests | RELATED | Settings | Guest feedback settings | Display Feedback on Text & Email Receipts |  |  |
| 分组二 | Guests | RELATED | Settings | Guest feedback settings | Display Feedback on Text & Email Receipts | Show optional feedback options on text & email receipts after payment is complete. |  |
| 分组二 | Guests | RELATED | Settings | Guest feedback settings | Manager Feedback Notification |  |  |
| 分组二 | Guests | RELATED | Settings | Guest feedback settings | Manager Feedback Notification | Notify manager(s) about guest feedback via text message or email. |  |
| 分组二 | Guests | RELATED | Settings | Guest feedback settings | Manager Feedback Notification | Notify for negative feedback only |  |
| 分组二 | Guests | RELATED | Settings | Guest feedback settings | Manager Feedback Notification | Notify for all feedback |  |
| 分组二 | Guests | RELATED | Settings | Guest feedback settings | Manager Feedback Notification | No notification |  |
| 分组二 | Guests | RELATED | Settings | Menu item feedback settings |  |  |  |
| 分组二 | Advertising |  |  |  |  |  |  |
| 分组二 | Advertising | Results you can see |  |  |  |  |  |
| 分组二 | Advertising | Results you can see | Drive growth by launching and managing your third party ads from one place. All without ever needing to leave Toast. |  |  |  |  |
| 分组二 | Advertising | Simple, smart advertising from $15 a day2 |  |  |  |  |  |
| 分组二 | Advertising | Simple, smart advertising from $15 a day2 | Go live in minutes3 with ready-to-use campaigns, AI-powered suggestions, and clear ROI tracking starting at just $15 a day.2 |  |  |  |  |
| 分组二 | Advertising | Always know how your ads are performing |  |  |  |  |  |
| 分组二 | Advertising | Always know how your ads are performing | Manage all ads and review performance from one dashboard fully integrated with online ordering, catering & events, Toast Tables, and in-store sales. |  |  |  |  |
| 分组二 | Marketing |  |  |  |  |  |  |
| 分组二 | Marketing | Assistant |  |  |  |  |  |
| 分组二 | Marketing | Assistant | Overall insights |  |  |  |  |
| 分组二 | Marketing | Assistant | Overall insights | Campaign sales |  |  |  |
| 分组二 | Marketing | Assistant | Overall insights | Offer sales |  |  |  |
| 分组二 | Marketing | Assistant | Overall insights | Loyalty orders |  |  |  |
| 分组二 | Marketing | Automations |  |  |  |  |  |
| 分组二 | Marketing | Automations | Active automations |  |  |  |  |
| 分组二 | Marketing | Automations | More Loyalty automations |  |  |  |  |
| 分组二 | Marketing | Impact |  |  |  |  |  |
| 分组二 | Marketing | Email marketing |  |  |  |  |  |
| 分组二 | Marketing | SMS marketing |  |  |  |  |  |
| 分组二 | Marketing | Offers |  |  |  |  |  |
| 分组二 | Marketing | Offers | Recommended offers |  |  |  |  |
| 分组二 | Marketing | Offers | Recommended offers | Recommended offer types are provided based on common performance goals. We use our most effective offer types to help you meet your goal. Results are not guaranteed. |  |  |  |
| 分组二 | Marketing | Offers | Archived offers |  |  |  |  |
| 分组二 | Marketing | Offers | Track & manage |  |  |  |  |
| 分组二 | Marketing | Loyalty |  |  |  |  |  |
| 分组二 | Marketing | Loyalty | Loyalty members |  |  |  |  |
| 分组二 | Marketing | Loyalty | Account merging |  |  |  |  |
| 分组二 | Marketing | Loyalty | Settings |  |  |  |  |
| 分组二 | Marketing | Loyalty | Loyalty insights |  |  |  |  |
| 分组二 | Marketing | Fundraising |  |  |  |  |  |
| 分组二 | Marketing | Related reports |  |  |  |  |  |
| 分组二 | Marketing | Related reports | Guest summary |  |  |  |  |
| 分组二 | Marketing | Brand hub |  |  |  |  |  |
| 分组二 | Front of house |  |  |  |  |  |  |
| 分组二 | Front of house | Toast Tables - Waitlist &Reservations |  |  |  |  |  |
| 分组二 | Front of house | Toast Tables - Waitlist &Reservations | Settings |  |  |  |  |
| 分组二 | Front of house | Toast Tables - Waitlist &Reservations | Settings | Configure your restaurant to accept bookings, including restaurant information and flow control |  |  |  |
| 分组二 | Front of house | Pre-shift notes |  |  |  |  |  |
| 分组二 | Front of house | Pre-shift notes | Display notes and other updates when employees clock into their shift. |  |  |  |  |
| 分组二 | Front of house | Pre-shift notes | Menu item stock |  |  |  |  |
| 分组二 | Front of house | Pre-shift notes | Menu item stock | Display out of stock and low stock menu items to employees when they clock into their shift. |  |  |  |
| 分组二 | Front of house | Order screen setup |  |  |  |  |  |
| 分组二 | Front of house | Order screen setup | These settings will affect the order screen experience for Table Service and the Quick Order screen. Additional settings unique to Table Service and Quick Order are available below this section. |  |  |  |  |
| 分组二 | Front of house | Order screen setup | Individually Hold and Send Items |  |  |  |  |
| 分组二 | Front of house | Order screen setup | Individually Hold and Send Items | Give servers full control over meal pacing by allowing them to individually hold and send items on a ticket. |  |  |  |
| 分组二 | Front of house | Order screen setup | Order by seat |  |  |  |  |
| 分组二 | Front of house | Order screen setup | Order by seat | Streamlines order entry by grouping menu item entry by seat and applying seat number based on seat selection in the check |  |  |  |
| 分组二 | Front of house | Order screen setup | Order by seat | Note: this feature is only available if the New POS Experience is on and if seat numbers are set to Optional or Required. Seat numbers are configured below. |  |  |  |
| 分组二 | Front of house | Order screen setup | Search bar for POS menu |  |  |  |  |
| 分组二 | Front of house | Order screen setup | Timestamps for when order is sent to kitchen |  |  |  |  |
| 分组二 | Front of house | Order screen setup | Consolidate discounts |  |  |  |  |
| 分组二 | Front of house | Order screen setup | Consolidate discounts | When the same discount is applied to several items, group the items together on the screen, and display the discount once on the order. |  |  |  |
| 分组二 | Front of house | Order screen setup | Prompt user if they're about to edit another server's check |  |  |  |  |
| 分组二 | Front of house | Order screen setup | Promo code search |  |  |  |  |
| 分组二 | Front of house | Order screen setup | Send order after check is paid |  |  |  |  |
| 分组二 | Front of house | Order screen setup | Send order after check is paid | Orders will only be sent to the kitchen once the check is paid in in full. For Take Out or Delivery dining options, this can be overridden by hitting the Send or Stay buttons. |  |  |  |
| 分组二 | Front of house | Order screen setup | Send order after check is paid | Note: This feature is not compatible with Text to Pay. |  |  |  |
| 分组二 | Front of house | Order screen setup | Exit order screen after printing receipt |  |  |  |  |
| 分组二 | Front of house | Order screen setup | Manual entry when using a scale |  |  |  |  |
| 分组二 | Front of house | Order screen setup | Send user back to passcode screen after completing a task |  |  |  |  |
| 分组二 | Front of house | Order screen setup | Send user back to passcode screen after completing a task | This would happen after tapping Send or Hold on the order screen, or Done on the payment screen. |  |  |  |
| 分组二 | Front of house | Order screen setup | Show total quantity of items in an order |  |  |  |  |
| 分组二 | Front of house | Order screen setup | Show total quantity of items in an order | Appears at the bottom of check details |  |  |  |
| 分组二 | Front of house | Order screen setup | Modifying items |  |  |  |  |
| 分组二 | Front of house | Order screen setup | Modifying items | Modifying items |  |  |  |
| 分组二 | Front of house | Order screen setup | Modifying items | Modifying items | Change dining option |  |  |
| 分组二 | Front of house | Order screen setup | Modifying items | Modifying items | Change course |  |  |
| 分组二 | Front of house | Order screen setup | Modifying items | Modifying items | Share plate |  |  |
| 分组二 | Front of house | Order screen setup | Modifying items | Modifying items | Special request |  |  |
| 分组二 | Front of house | Order screen setup | Modifying items | These are extra options on the order screen that let a server change how an individual item is ordered, without affecting the rest of the check. |  |  |  |
| 分组二 | Front of house | Order screen setup | Special request price entry |  |  |  |  |
| 分组二 | Front of house | Order screen setup | Special request price entry | When enabled, users can add a price to charge for each Special request. |  |  |  |
| 分组二 | Front of house | Order screen setup | UI options |  |  |  |  |
| 分组二 | Front of house | Order screen setup | UI options | Manage more POS settings |  |  |  |
| 分组二 | Front of house | Quick order |  |  |  |  |  |
| 分组二 | Front of house | Quick order | Which buttons do you want to see on your order screen? |  |  |  |  |
| 分组二 | Front of house | Quick order | Which buttons do you want to see on your order screen? | Send |  |  |  |
| 分组二 | Front of house | Quick order | Which buttons do you want to see on your order screen? | Send | Sends the order to the kitchen and exits the order screen. |  |  |
| 分组二 | Front of house | Quick order | Which buttons do you want to see on your order screen? | Stay |  |  |  |
| 分组二 | Front of house | Quick order | Which buttons do you want to see on your order screen? | Stay | Sends the order to the kitchen, but keeps you on the order screen if you need to add more items. |  |  |
| 分组二 | Front of house | Quick order | Which buttons do you want to see on your order screen? | Hold |  |  |  |
| 分组二 | Front of house | Quick order | Which buttons do you want to see on your order screen? | Hold | Saves items to an order, but won't send them to the kitchen. |  |  |
| 分组二 | Front of house | Quick order | Fast cash button |  |  |  |  |
| 分组二 | Front of house | Quick order | Fast cash button | Sends an order and immediately closes it out to cash. |  |  |  |
| 分组二 | Front of house | Quick order | Require a tab name |  |  |  |  |
| 分组二 | Front of house | Quick order | Require a tab name | User is prompted for a tab name when hitting the Send or Pay buttons. |  |  |  |
| 分组二 | Front of house | Quick order | Prompt for dining option |  |  |  |  |
| 分组二 | Front of house | Quick order | Prompt for dining option | If no default dining option is set for quick order, the user will be asked to select one for each new order. |  |  |  |
| 分组二 | Front of house | Quick order | Seat numbers |  |  |  |  |
| 分组二 | Front of house | Quick order | Seat numbers | Required |  |  |  |
| 分组二 | Front of house | Quick order | Seat numbers | Optional |  |  |  |
| 分组二 | Front of house | Quick order | Seat numbers | Off |  |  |  |
| 分组二 | Front of house | Quick order | Coursing |  |  |  |  |
| 分组二 | Front of house | Quick order | Coursing | Prompt servers to have courses assigned to all items before sending an order to the kitchen. |  |  |  |
| 分组二 | Front of house | Quick order | Coursing | Required |  |  |  |
| 分组二 | Front of house | Quick order | Coursing | Optional |  |  |  |
| 分组二 | Front of house | Quick order | Coursing | Off |  |  |  |
| 分组二 | Front of house | Table service |  |  |  |  |  |
| 分组二 | Front of house | Table service | Seat numbers |  |  |  |  |
| 分组二 | Front of house | Table service | Seat numbers | Required |  |  |  |
| 分组二 | Front of house | Table service | Seat numbers | Optional |  |  |  |
| 分组二 | Front of house | Table service | Seat numbers | Off |  |  |  |
| 分组二 | Front of house | Table service | Coursing |  |  |  |  |
| 分组二 | Front of house | Table service | Coursing | Prompt servers to have courses assigned to all items before sending an order to the kitchen. |  |  |  |
| 分组二 | Front of house | Table service | Coursing | Required |  |  |  |
| 分组二 | Front of house | Table service | Coursing | Optional |  |  |  |
| 分组二 | Front of house | Table service | Coursing | Off |  |  |  |
| 分组二 | Front of house | Service areas & tables |  |  |  |  |  |
| 分组二 | Front of house | Service areas & tables | POS table layout |  |  |  |  |
| 分组二 | Front of house | Service areas & tables | POS table layout | Create your restaurant floor plan |  |  |  |
| 分组二 | Front of house | Service areas & tables | Service areas |  |  |  |  |
| 分组二 | Front of house | Service areas & tables | Service areas | Group tables to customize settings for restaurant sections |  |  |  |
| 分组二 | Front of house | Service areas & tables | Revenue centers |  |  |  |  |
| 分组二 | Front of house | Service areas & tables | Revenue centers | Enable tracking sales generated by one or more service areas, tables and devices |  |  |  |
| 分组二 | Front of house | Mobile dining solutions |  |  |  |  |  |
| 分组二 | Front of house | Mobile dining solutions | Toast Mobile Order & Pay™ & Digital |  |  |  |  |
| 分组二 | Front of house | Mobile dining solutions | Toast Mobile Order & Pay™ & Digital | MenusAllow dine-in guests to scan QR codes to view digital menus, order, and pay. |  |  |  |
| 分组二 | Front of house | POS notifications |  |  |  |  |  |
| 分组二 | Front of house | POS notifications | Service prompts |  |  |  |  |
| 分组二 | Front of house | POS notifications | Service prompts | Create and edit prompts for servers to take specific actions on an order |  |  |  |
| 分组二 | Front of house | POS notifications | Notification setup |  |  |  |  |
| 分组二 | Front of house | POS notifications | Notification setup | Enable order-related and offline alerts on the POS |  |  |  |
| 分组二 | Front of house | POS notifications | Send notifications |  |  |  |  |
| 分组二 | Front of house | POS notifications | Send notifications | Send custom notifications to your employees via the POS |  |  |  |
| 分组二 | Front of house | Employee SOS |  |  |  |  |  |
| 分组二 | Front of house | Employee SOS | Text alert |  |  |  |  |
| 分组二 | Front of house | Employee SOS | Text alert | A way for staff to reach a manager when they need help during a shift |  |  |  |
| 分组二 | Front of house | Related reports |  |  |  |  |  |
| 分组二 | Front of house | Related reports | Sales summary |  |  |  |  |
| 分组二 | Front of house | Related reports | Sales summary | Day-to-day top numbers for sales, payments, sales categories, cash and more |  |  |  |
| 分组二 | Front of house | Related reports | Drawer history |  |  |  |  |
| 分组二 | Front of house | Related reports | Drawer history | Cash activity for a single location and day |  |  |  |
| 分组二 | Kitchen |  |  |  |  |  |  |
| 分组二 | Kitchen | Printers, tickets, & KDS devices |  |  |  |  |  |
| 分组二 | Kitchen | Printers, tickets, & KDS devices | Kitchen and ticket setup |  |  |  |  |
| 分组二 | Kitchen | Printers, tickets, & KDS devices | Kitchen and ticket setup | Set up kitchen displays, prep station and expediter printers, and the information displayed on your tickets |  |  |  |
| 分组二 | Kitchen | Dining options |  |  |  |  |  |
| 分组二 | Kitchen | Dining options | Dining options |  |  |  |  |
| 分组二 | Kitchen | Dining options | Dining options | All the ways you serve your food, from dine in to delivery |  |  |  |
| 分组二 | Kitchen | Kitchen stations |  |  |  |  |  |
| 分组二 | Kitchen | Kitchen stations | Prep stations |  |  |  |  |
| 分组二 | Kitchen | Kitchen stations | Assembly Lines |  |  |  |  |
| 分组二 | Kitchen | Kitchen stations | Assembly Lines | Create and manage fulfillment sequences for prep stations |  |  |  |
| 分组二 | Kitchen | Kitchen stations | Item routing |  |  |  |  |
| 分组二 | Kitchen | Kitchen stations | Production items |  |  |  |  |
| 分组二 | Kitchen | Kitchen stations | Production items | Create and manage production items |  |  |  |
| 分组二 | Kitchen | Timing |  |  |  |  |  |
| 分组二 | Kitchen | Timing | Prep/delivery times |  |  |  |  |
| 分组二 | Kitchen | Timing | Prep/delivery times | Change Online Ordering and POS prep times and update delivery times |  |  |  |
| 分组二 | Kitchen | Pacing |  |  |  |  |  |
| 分组二 | Kitchen | Pacing | Courses |  |  |  |  |
| 分组二 | Kitchen | Pacing | Courses | Create and manage courses |  |  |  |
| 分组二 | Kitchen | Pacing | Meal pacing |  |  |  |  |
| 分组二 | Kitchen | Pacing | Meal pacing | Set up meal pacing, coursing, and item fire by prep time |  |  |  |
| 分组二 | Kitchen | Related reports |  |  |  |  |  |
| 分组二 | Kitchen | Related reports | Tickets by hour |  |  |  |  |
| 分组二 | Kitchen | Related reports | Tickets by hour | Hourly net sales and average ticket fulfillment time |  |  |  |
| 分组二 | Kitchen | Related reports | Ticket details |  |  |  |  |
| 分组二 | Kitchen | Related reports | Ticket details | All ticket and fulfillment details, including time and location |  |  |  |
| 分组二 | Kitchen | Related reports | Kitchen overview |  |  |  |  |
| 分组二 | Kitchen | Related reports | Kitchen overview | Overview of all your configured kitchen devices and settings |  |  |  |
| 分组二 | xtraCHEF |  |  |  |  |  |  |
| 分组二 | Waitlist & Reservation |  |  |  |  |  |  |
| 分组二 | Waitlist & Reservation | Overview |  |  |  |  |  |
| 分组二 | Waitlist & Reservation | Calendar |  |  |  |  |  |
| 分组二 | Waitlist & Reservation | Settings |  |  |  |  |  |
| 分组二 | Waitlist & Reservation | Settings | General |  |  |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Restaurant profile |  |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Restaurant profile | Some of the information is pulled in is from your broader Toast settings. You have the option to modify if needed. This information will be used for guest facing experiences for Toast Tables. |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Restaurant profile | Sansan Ramen |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Restaurant profile | Contact number |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Restaurant profile | Contact email |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Restaurant profile | Restaurant website URL |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Restaurant profile | About your restaurant |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Restaurant profile | Add a cover photo |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Toast integrations |  |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Toast integrations | Toast Tables works better with other features. Enable Integrations to enhance your guest's experience. |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Toast integrations | Start Order on POS |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Toast integrations | Start Order on POS | Toast Tables will start an order on the POS at the table once a party is seated. You will be required to assign a server to each table at time of seating in the host app. Turning this on will tie order and guest data together, allowing you to see guests from Toast Tables in the Guestbook report. |  |
| 分组二 | Waitlist & Reservation | Settings | General | Toast integrations | Loyalty Program |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Toast integrations | Loyalty Program | Turning this on allows your guest to join your loyalty program through their confirmation link. |  |
| 分组二 | Waitlist & Reservation | Settings | General | Toast integrations | Order & Pay |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Toast integrations | Order & Pay | Guests will be texted a link to order once their party is seated in the Toast Tables host app. |  |
| 分组二 | Waitlist & Reservation | Settings | General | Host app permissions |  |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Host app permissions | Manage and control key features and actions within the Host app by configuring whether a POS access code is required. This ensures proper permission settings and accurate record keeping for all team member activity. |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Host app permissions | Payments |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Host app permissions | Payments | Initiate cancellation fee |  |
| 分组二 | Waitlist & Reservation | Settings | General | Host app permissions | Payments | Waive cancellation fee |  |
| 分组二 | Waitlist & Reservation | Settings | General | Host app permissions | Reservations |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Host app permissions | Reservations | Create reservation |  |
| 分组二 | Waitlist & Reservation | Settings | General | Host app permissions | Reservations | Edit reservation |  |
| 分组二 | Waitlist & Reservation | Settings | General | Host app permissions | Reservations | Cancel reservation |  |
| 分组二 | Waitlist & Reservation | Settings | General | Dining areas |  |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Dining areas | Dining Areas consist of one or more of your existing Services Areas configured within Toast, allowing guests/hosts to select a particular part of your restaurant to book (e.g. Indoor or Outdoor). Settings like turn times, online availability, and special date settings can be customized by Dining Area. |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Dining areas | Your Dining Areas |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Dining areas | Your Dining Areas | Drag and drop Service areas within Dining areas. Each Dining area must include at least one Service area to be bookable. The order of your dining areas is the order guests will see when booking. |  |
| 分组二 | Waitlist & Reservation | Settings | General | Table capacity |  |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Table capacity | Configure the capacity of your tables in each dining area. Table capacity will affect table availability based on party sizes entered. Note: Table names are pulled in from POS settings. |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Combo tables |  |  |  |
| 分组二 | Waitlist & Reservation | Settings | General | Combo tables | Create and manage combinations of tables to accomodate larger parties. This can be for tables you often push together or book together for large groups. Manage availability for combo tables in your designated shifts. |  |  |
| 分组二 | Waitlist & Reservation | Settings | Booking & ticket rules |  |  |  |  |
| 分组二 | Waitlist & Reservation | Settings | Booking & ticket rules | Prepayment rules |  |  |  |
| 分组二 | Waitlist & Reservation | Settings | Booking & ticket rules | Prepayment rules | Create and manage all your prepayment rules for reservations. |  |  |
| 分组二 | Waitlist & Reservation | Settings | Booking & ticket rules | Deposit rules |  |  |  |
| 分组二 | Waitlist & Reservation | Settings | Booking & ticket rules | Deposit rules | Create and manage deposits for reservations. Apply these rules by assigning them to your designated shifts under "Schedules." |  |  |
| 分组二 | Waitlist & Reservation | Settings | Booking & ticket rules | Cancellation fee rules |  |  |  |
| 分组二 | Waitlist & Reservation | Settings | Booking & ticket rules | Cancellation fee rules | Cancellation fees help reduce no-shows by encouraging guest commitment. Guests will be required to enter a credit card when booking and can be charged a fee for late cancellations or no-shows based on your policy. Simply create a cancellation fee rule and add it to your shifts or experiences. |  |  |
| 分组二 | Waitlist & Reservation | Settings | Guest communication |  |  |  |  |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | SMS |  |  |  |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | SMS | Configure your SMS messages that your guests will receive for Reservations and Waitlist. |  |  |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | SMS | 2-Way Messaging |  |  |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | SMS | 2-Way Messaging | Your host will be able to view and reply to text messages from guests within the Host App.This feature is designed for the purpose of sending guests SMS messages about their reservation or waitlist booking with your restaurant, and should not be used for marketing or any other purpose not directly related to such reservation or booking. |  |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | SMS | Reservations Templates |  |  |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | SMS | Reservations Templates | Reservation Confirmation |  |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | SMS | Reservations Templates | Reservation Confirmation | This SMS will be sent when your guests book a reservation. |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | SMS | Reservations Templates | Reservation Reminder |  |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | SMS | Reservations Templates | Reservation Reminder | This SMS will be sent to guests 24 hours before their booking time. |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | SMS | Reservations Templates | Reservation Cancellation |  |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | SMS | Reservations Templates | Reservation Cancellation | This is the confirmation text your guest receives when their reservation is cancelled. |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | SMS | Reservations Templates | Reservation Notify |  |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | SMS | Reservations Templates | Reservation Notify | This optional SMS will allow you to send a notification to guests that their table is ready. |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | SMS | Reservations Templates | Payment Reminder |  |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | SMS | Reservations Templates | Payment Reminder | This SMS will be sent prompting a guest to pay their payment within your configured auto-cancelation time frame. |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | SMS | Waitlist Templates |  |  |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | SMS | Waitlist Templates | Joined Waitlist Confirmation |  |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | SMS | Waitlist Templates | Joined Waitlist Confirmation | This SMS will be sent when your guest is added to the waitlist via onsite or remote. |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | SMS | Waitlist Templates | Waitlist Notification |  |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | SMS | Waitlist Templates | Waitlist Notification | This SMS will be sent when your guest is ready to be seated. |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | SMS | Waitlist Templates | Waitlist Cancellation |  |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | SMS | Waitlist Templates | Waitlist Cancellation | This is the confirmation text your guest receives when they are removed from the waitlist. |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | Email templates |  |  |  |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | Email templates | Configure emails that your guests will receive for Reservations. |  |  |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | Email templates | Email Reservation Confirmation |  |  |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | Email templates | Email Reservation Confirmation | This email will be sent when your guests book a reservation. |  |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | Email templates | Email Reservation Modifications |  |  |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | Email templates | Email Reservation Modifications | This email will be sent to guests when there are modifications to their reservations. |  |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | Email templates | Email Reservation Cancellation |  |  |
| 分组二 | Waitlist & Reservation | Settings | Guest communication | Email templates | Email Reservation Cancellation | This email will be sent to guest when their reservation has been cancelled. |  |
| 分组二 | Waitlist & Reservation | Settings | Waitlist |  |  |  |  |
| 分组二 | Waitlist & Reservation | Settings | Waitlist | Wait time estimator |  |  |  |
| 分组二 | Waitlist & Reservation | Settings | Waitlist | Wait time estimator | Toast will use these settings to determine an estimated wait time for your guests. |  |  |
| 分组二 | Waitlist & Reservation | Settings | Waitlist | Wait time estimator | Manual Multiplier |  |  |
| 分组二 | Waitlist & Reservation | Settings | Waitlist | Wait time estimator | Manual Multiplier | Simple linear equation based on place in line, great for keeping your settings simple |  |
| 分组二 | Waitlist & Reservation | Settings | Waitlist | Wait time estimator | Smart Algorithm |  |  |
| 分组二 | Waitlist & Reservation | Settings | Waitlist | Wait time estimator | Smart Algorithm | Dynamic, great if you seat every party in the app and have set up general settings |  |
| 分组二 | Waitlist & Reservation | Settings | Waitlist | Waitlist policy |  |  |  |
| 分组二 | Waitlist & Reservation | Settings | Waitlist | Waitlist policy | Customize your restaurant's policy shown to guests added to the waitlist. The guest will see this policy in the link sent via their confirmation SMS. |  |  |
| 分组二 | Waitlist & Reservation | Settings | Waitlist | Online access |  |  |  |
| 分组二 | Waitlist & Reservation | Settings | Waitlist | Online access | Manage global settings for online waitlist. |  |  |
| 分组二 | Waitlist & Reservation | Settings | Waitlist | Online access | Guest Facing Options |  |  |
| 分组二 | Waitlist & Reservation | Settings | Waitlist | Online access | Guest Facing Options | Show guests an estimated wait time |  |
| 分组二 | Waitlist & Reservation | Settings | Waitlist | Online access | Guest Facing Options | Show guests an estimated wait time | Let guests know their estimated wait time. Estimation quotes will be based on your Wait Time Estimator settings. |
| 分组二 | Waitlist & Reservation | Settings | Waitlist | Online access | Guest Facing Options | Show guests their place in line |  |
| 分组二 | Waitlist & Reservation | Settings | Waitlist | Online access | Guest Facing Options | Show guests their place in line | When ON, guests will see the number of parties ahead of them in line. When OFF, this information will be hidden from guests. |
| 分组二 | Waitlist & Reservation | Settings | Waitlist | Online access | Guest Facing Options | Allow guests to join online if there is no wait |  |
| 分组二 | Waitlist & Reservation | Settings | Waitlist | Online access | Guest Facing Options | Allow guests to join online if there is no wait | When ON, guests will be able to join your online waitlist even if there is no wait. When OFF, guests will need to join in person if there is no wait. |
| 分组二 | Waitlist & Reservation | Settings | Waitlist | Online access | Online Waitlist Third Party Integrations |  |  |
| 分组二 | Waitlist & Reservation | Settings | Waitlist | Online access | Online Waitlist Third Party Integrations | Select integrations you would like to enable. |  |
| 分组二 | Waitlist & Reservation | Settings | Reservations |  |  |  |  |
| 分组二 | Waitlist & Reservation | Settings | Reservations | Reservation controls |  |  |  |
| 分组二 | Waitlist & Reservation | Settings | Reservations | Reservation controls | Manage global settings for reservations. |  |  |
| 分组二 | Waitlist & Reservation | Settings | Reservations | Reservation controls | Reservations |  |  |
| 分组二 | Waitlist & Reservation | Settings | Reservations | Reservation controls | Reservations | Enable Reservations Globally |  |
| 分组二 | Waitlist & Reservation | Settings | Reservations | Reservation controls | Reservations | Disabling reservations will remove the reservation list from the host app (including any active reservations) and prevent both employees and guests from creating new reservations. |  |
| 分组二 | Waitlist & Reservation | Settings | Reservations | Reservation controls | Online Reservation Third Party Integrations |  |  |
| 分组二 | Waitlist & Reservation | Settings | Reservations | Reservation controls | Online Reservation Third Party Integrations | Select integrations you would like to enable. |  |
| 分组二 | Waitlist & Reservation | Settings | Reservations | Reservation policy |  |  |  |
| 分组二 | Waitlist & Reservation | Settings | Reservations | Reservation policy | Modify the policy shown to guest when booking a reservation. This policy can be accessed at time of booking and in the guest's reservation confirmation SMS. |  |  |
| 分组二 | Waitlist & Reservation | Reports |  |  |  |  |  |
| 分组二 | Waitlist & Reservation | Schedules |  |  |  |  |  |
| 分组二 | Waitlist & Reservation | Experiences |  |  |  |  |  |
| 分组二 | Waitlist & Reservation | What's new? |  |  |  |  |  |
| 分组二 | Waitlist & Reservation | Cheat Sheet |  |  |  |  |  |
| 分组二 | Retail |  |  |  |  |  |  |
| 分组二 | Scheduling |  |  |  |  |  |  |
| 分组二 | Scheduling | Create a free scheduling accountSling by Toast helps you build your employees' work schedules in minutes, no matter the size of your business.Set up your account with a click of a button and see your employees, timesheets and sales sync from Toast to Sling. Save time and money with faster and simpler employee scheduling. |  |  |  |  |  |
| 分组二 | Scheduling | Create a free scheduling accountSling by Toast helps you build your employees' work schedules in minutes, no matter the size of your business.Set up your account with a click of a button and see your employees, timesheets and sales sync from Toast to Sling. Save time and money with faster and simpler employee scheduling. | 免费创建排班账户 |  |  |  |  |
| 分组二 | Scheduling | Create a free scheduling accountSling by Toast helps you build your employees' work schedules in minutes, no matter the size of your business.Set up your account with a click of a button and see your employees, timesheets and sales sync from Toast to Sling. Save time and money with faster and simpler employee scheduling. | Toast 旗下的 Sling 帮助您在几分钟内制定员工的工作时间表，无论您的企业规模如何。 |  |  |  |  |
| 分组二 | Scheduling | Create a free scheduling accountSling by Toast helps you build your employees' work schedules in minutes, no matter the size of your business.Set up your account with a click of a button and see your employees, timesheets and sales sync from Toast to Sling. Save time and money with faster and simpler employee scheduling. | 只需点击一个按钮即可设置您的帐户，并查看您的员工、考勤表和销售额从 Toast 同步到 Sling。通过更快、更简单的员工排班来节省时间和金钱。 |  |  |  |  |
| 分组二 | Scheduling | Create a free scheduling accountSling by Toast helps you build your employees' work schedules in minutes, no matter the size of your business.Set up your account with a click of a button and see your employees, timesheets and sales sync from Toast to Sling. Save time and money with faster and simpler employee scheduling. | 获得 15 天的免费 Scheduling Pro 试用期。Scheduling Lite 始终免费。 |  |  |  |  |
| 分组二 | Scheduling | Get a free 15-day trial of Scheduling Pro. Scheduling Lite is always free. |  |  |  |  |  |
| 分组二 | Websites |  |  |  |  |  |  |
| 分组二 | Manager Log |  |  |  |  |  |  |
| 分组二 | Manager Log | This week |  |  |  |  |  |
| 分组二 | Manager Log | This week | Today |  |  |  |  |
| 分组二 | Manager Log | This week | Monday, April 13th, 2026 |  |  |  |  |
| 分组二 | Manager Log | This week | Sunday, April 12th, 2026 |  |  |  |  |
| 分组二 | Manager Log | Last week |  |  |  |  |  |
| 分组二 | Manager Log | Last week | Saturday, April 11th, 2026 |  |  |  |  |
| 分组二 | Manager Log | Last week | Friday, April 10th, 2026 |  |  |  |  |
| 分组二 | Manager Log | Last week | Thursday, April 9th, 2026 |  |  |  |  |
| 分组二 | Manager Log | Last week | Wednesday, April 8th, 2026 |  |  |  |  |
| 分组二 | Manager Log | Last week | Tuesday, April 7th, 2026 |  |  |  |  |
| 分组二 | Manager Log | Last week | Monday, April 6th, 2026 |  |  |  |  |
| 分组二 | Manager Log | Last week | Sunday, April 5th, 2026 |  |  |  |  |
| 分组三 |  |  |  |  |  |  |  |
| 分组三 | Integrations |  |  |  |  |  |  |
| 分组三 | Integrations | Integration management |  |  |  |  |  |
| 分组三 | Integrations | Integration management | Browse & purchase integrations |  |  |  |  |
| 分组三 | Integrations | Integration management | Browse & purchase integrations | Discover and add integrations to your restaurant. |  |  |  |
| 分组三 | Integrations | Integration management | Configure integrations |  |  |  |  |
| 分组三 | Integrations | Integration management | Configure integrations | View and manage your purchased integrations. |  |  |  |
| 分组三 | Integrations | Integration management | Integration audit history |  |  |  |  |
| 分组三 | Integrations | Integration management | Integration audit history | History of integrations added and removed. |  |  |  |
| 分组三 | Integrations | Toast API access |  |  |  |  |  |
| 分组三 | Integrations | Toast API access | Manage credentials |  |  |  |  |
| 分组三 | Integrations | Toast API access | Manage credentials | View and manage your Toast API credentials. |  |  |  |
| 分组三 | Shop |  |  |  |  |  |  |
| 分组三 | Toast account |  |  |  |  |  |  |
| 分组三 | Toast account | Billing |  |  |  |  |  |
| 分组三 | Toast account | Billing | Billing & Invoicing |  |  |  |  |
| 分组三 | Toast account | Billing | Billing & Invoicing | Access all your monthly invoices for software fees and hardware purchases |  |  |  |
| 分组三 | Toast account | Billing | Chargeback reports |  |  |  |  |
| 分组三 | Toast account | Billing | Chargeback reports | Disputed credit card transactions and response deadlines |  |  |  |
| 分组三 | Toast account | Billing | Financial setup |  |  |  |  |
| 分组三 | Toast account | Billing | Financial setup | View legal info |  |  |  |
| 分组三 | Toast account | Billing | Bank accounts |  |  |  |  |
| 分组三 | Toast account | Billing | Bank accounts | Manage bank accounts for Toast payments and deposits |  |  |  |
| 分组三 | Toast account | My Products |  |  |  |  |  |
| 分组三 | Toast account | My Products | Subscriptions |  |  |  |  |
| 分组三 | Toast account | My Products | Subscriptions | View all software products and services on your account |  |  |  |
| 分组三 | Toast account | Business and location management |  |  |  |  |  |
| 分组三 | Toast account | Business and location management | General information |  |  |  |  |
| 分组三 | Toast account | Business and location management | General information | Manage business description, logo, banner image, and public links |  |  |  |
| 分组三 | Toast account | Business and location management | Business information |  |  |  |  |
| 分组三 | Toast account | Business and location management | Business information | Manage legal information for your business and owners |  |  |  |
| 分组三 | Toast account | Business and location management | Location information |  |  |  |  |
| 分组三 | Toast account | Business and location management | Location information | Manage location name, phone, address and billing |  |  |  |
| 分组三 | Toast account | Business and location management | Location groups |  |  |  |  |
| 分组三 | Toast account | Business and location management | Location groups | Organize locations with custom and loyalty groups |  |  |  |
| 分组三 | Toast account | Finance |  |  |  |  |  |
| 分组三 | Toast account | Finance | Apply for Toast Capital |  |  |  |  |
| 分组三 | Toast account | Finance | Apply for Toast Capital | Get a loan to help with any improvements, expansions, or repairs |  |  |  |
| 分组三 | Toast account | Finance | Referral Program |  |  |  |  |
| 分组三 | Toast account | Finance | Referral Program | Help a local business and get rewarded for growing the Toast community |  |  |  |
| 分组三 | Toast account | Test orders |  |  |  |  |  |
| 分组三 | Toast account | Test orders | Archive test orders |  |  |  |  |
| 分组三 | Toast account | Test orders | Archive test orders | Archive orders placed in test mode |  |  |  |
| 分组三 | Toast account | Test Kitchen |  |  |  |  |  |
| 分组三 | Toast account | Test Kitchen | Test KitchenTest Kitchen |  |  |  |  |
| 分组三 | Toast account | Test Kitchen | Test KitchenTest Kitchen | Opt-in to test new features and explore ideas that we’re considering building next |  |  |  |
| 分组三 | Toast account | Notifications & alerts |  |  |  |  |  |
| 分组三 | Toast account | Notifications & alerts | Communication preferences |  |  |  |  |
| 分组三 | Toast account | Notifications & alerts | Communication preferences | Manage who should be contacted if your restaurant encounters service or product disruptions |  |  |  |
| 分组三 | Toast account | Notifications & alerts | Contact settings (Old) |  |  |  |  |
| 分组三 | Toast account | Notifications & alerts | Contact settings (Old) | Manage who receives emails for performance summaries, orders, release notes and finance updates |  |  |  |
| 分组三 | Toast account | Groups |  |  |  |  |  |
| 分组三 | Toast account | Groups | Device Groups |  |  |  |  |
| 分组三 | Toast account | Publishing |  |  |  |  |  |
| 分组三 | Toast account | Publishing | Publishing Center – History |  |  |  |  |
| 分组三 | Toast account | Publishing | Publishing Center – History | See what was published at your location(s), when it was published, and who published it |  |  |  |
| 分组三 | Toast account | Publishing | Publish Config |  |  |  |  |
| 分组三 | Toast account | Publishing | Publish Config V2 |  |  |  |  |
| 分组三 | Toast account | Privacy Compliance |  |  |  |  |  |
| 分组三 | Toast account | Privacy Compliance | Privacy Compliance |  |  |  |  |
| 分组三 | Toast account | Privacy Compliance | Privacy Compliance | Manage various privacy-related obligations, including individual rights requests. |  |  |  |
| 分组三 | Toast account | Wi-Fi configuration |  |  |  |  |  |
| 分组三 | Toast account | Wi-Fi configuration | Wi-Fi configuration |  |  |  |  |
| 分组三 | Toast account | Wi-Fi configuration | Wi-Fi configuration | Your network is managed by Toast. |  |  |  |
| 分组三 | Toast account | Wi-Fi configuration | Network name |  |  |  |  |
| 分组三 | Toast account | Wi-Fi configuration | Network name | SANSAN_RAMEN_SECURE |  |  |  |
| 分组三 | Toast account | Wi-Fi configuration | Network name | Password |  |  |  |
| 分组三 | Support Center |  |  |  |  |  |  |
| 分组三 | Support Center | Connect and learn |  |  |  |  |  |
| 分组三 | Support Center | Connect and learn | Toast Community |  |  |  |  |
| 分组三 | Support Center | Connect and learn | Toast Community | Share tips and connect with other operators. |  |  |  |
| 分组三 | Support Center | Connect and learn | Toast Classroom |  |  |  |  |
| 分组三 | Support Center | Connect and learn | Toast Classroom | Get step-by-step guidance and best practices—live and on-demand. |  |  |  |
| 分组三 | Support Center | Connect and learn | Daily Office Hours |  |  |  |  |
| 分组三 | Support Center | Connect and learn | Daily Office Hours | Join a session for quick problem-solving with a Toast Trainer. |  |  |  |
| 分组三 | Support Center | Connect and learn | Product updates |  |  |  |  |
| 分组三 | Support Center | Connect and learn | Product updates | See the latest fixes, improvements, and new features. |  |  |  |
| 分组四 |  |  |  |  |  |  |  |
| 分组四 | Internal tools |  |  |  |  |  |  |
| 分组四 | Internal tools | Menus |  |  |  |  |  |
| 分组四 | Internal tools | Menus | Menu cleanup |  |  |  |  |
| 分组四 | Internal tools | Menus | Menu audit tool |  |  |  |  |
| 分组四 | Device hub |  |  |  |  |  |  |
| 分组四 | Device hub | Device name |  |  |  |  |  |
| 分组四 | Device hub | Device status |  |  |  |  |  |
| 分组四 | Device hub | Alerts |  |  |  |  |  |
| 分组四 | Device hub | Serial number |  |  |  |  |  |
| 分组四 | Device hub | Last seen |  |  |  |  |  |
| 分组四 | Device hub | Enabled connections |  |  |  |  |  |
| 分组四 | Device hub | IP address |  |  |  |  |  |
