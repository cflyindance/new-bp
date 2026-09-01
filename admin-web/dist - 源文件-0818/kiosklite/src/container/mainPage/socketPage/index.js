import React from 'react';
import { connect } from 'react-redux';
import { serverURL as serverIP } from '@/constants/serverURL';
import {
  posFrontLog,
  fetchMenuGroup,
  fetchSystemConfig,
  fetchTaxInfo,
  fetchItemSizeList,
  fetchSystemConfigAllList,
  getMarginappFetchConfig,
} from '@/api';
import {
  setConnectWs,
  setIsMenuUpdated,
  setMakingCupNum,
  initMenuGroup2,
  initConfigParams,
  setSelfConfig,
} from '@/actions';
import { setFreeItemMenuPosition } from '@/actions/crm_action';
import { getCookie, judgeSskeyIsActiveTime } from '@/utils';
import { homeHash } from '@/constants/mockData';
import { EventBus } from '@/utils/EventBus';
import { debounce } from 'lodash';
import { isConfigSettingRoute } from '@/constants/ConfigSettingRoute';
import { getItemsWithStockNum, getOutOfStockItems } from '@/utils/menuStock';

// ==================== 常量配置 ====================
/** WebSocket 重连和日志节流时间间隔（毫秒） */
const RECONNECT_INTERVAL = 30000;

/** 心跳间隔时间（秒） */
const HEARTBEAT_INTERVAL = 5;

/** 心跳重置阈值（秒） */
const HEARTBEAT_RESET_THRESHOLD = 10;

/** WebSocket 连接延迟时间（毫秒） */
const WS_CONNECT_DELAY = 1000;

/** 需要更新菜单的页面路由模式 */
const MENU_UPDATE_PATTERNS = [
  'orderType',
  'orderPage',
  'orderReview',
];

/** ws onclose 上报 posFrontLog 的全局节流时间戳（跨实例、防 30s 边界双发） */
let lastWsClosePosFrontLogTime = 0;

class SocketPage extends React.Component {
  constructor(props) {
    super(props);
    this.trackedKioskLicense = getCookie('kioskLicense');
    // WebSocket 相关
    this.ws = null;
    this.heartBeatTimer = null;
    this.reconnectTimer = null;

    // 连接状态控制
    this.WS = {
      timer: false, // 防止重复连接
    };
    
    // 心跳机制状态
    this.everysec = {
      serverbeat: 0, // 服务器心跳计数
      beattimer: 0, // 心跳定时器计数
      beatinterval: HEARTBEAT_INTERVAL, // 心跳间隔
    };
  }

  /**
   * WebSocket 重连定时器回调
   * 在重连间隔后尝试重新连接
   */
  callWebSocketTimer = () => {
    this.WS.timer = false;
    judgeSskeyIsActiveTime().then(() => {
      setTimeout(this.callWebSocket, WS_CONNECT_DELAY);
    });
  };

  /**
   * 获取 WebSocket 连接 URL
   */
  getWebSocketUrl = () => {
    const cookieHost = getCookie('kioskServerIP');
    const serverURL = cookieHost || serverIP;
    return serverURL.replace('http:', 'ws:').replace('https:', 'wss:') + 'webapp/webSocket/systemInfo';
  };

  /**
   * 处理 WebSocket 连接打开事件
   */
  handleWebSocketOpen = () => {
    this.props.setConnectWs(true);
    this.ws.send(
      JSON.stringify({
        instanceName: getCookie('kioskLicense'),
        sessionKey: getCookie('sessionKey'),
      })
    );
    setTimeout(this.initHeartBeat, WS_CONNECT_DELAY);
  };

  /**
   * 处理菜单更新消息
   */
  handleMenuUpdate = debounce(() => {
    console.log('%c updated menu', 'color: green;');
    const currentHash = window.location.hash || '#/';
    const normalizedHash = currentHash.split('?')[0];
    const isHomePage = homeHash.some((hash) => normalizedHash === hash);
    const isMenuUpdatePage = MENU_UPDATE_PATTERNS.some((pattern) =>
      normalizedHash.includes(pattern)
    );

    const fullUpdate = isHomePage || isMenuUpdatePage;

    if (!isConfigSettingRoute()) {
      this.updateConfigMenu(fullUpdate);
    } else {
      this.props.setIsMenuUpdated(true);
    }
  }, 3 * 1000);

  /**
   * 处理 Kiosk 状态消息
   */
  handleKioskStatus = (status) => {
    if (status === 'open') {
      EventBus.emit('open_kiosk_modal');
    } else if (status === 'close') {
      EventBus.emit('close_kiosk_modal');
    }
  };

  /**
   * 处理制作杯数更新
   */
  handleMakingCupNumUpdate = (customerDisplayRecords) => {
    if (customerDisplayRecords?.length > 0) {
      const lastRecord = customerDisplayRecords[customerDisplayRecords.length - 1];
      this.props.setMakingCupNum(lastRecord.itemCount);
    }
  };

  /**
   * 处理 WebSocket 接收到的消息
   */
  handleWebSocketMessage = (event) => {
    try {
      const msgData = JSON.parse(event.data);

      // 处理菜单更新
      if (msgData.menuUpdated) {
        this.handleMenuUpdate();
      }

      // 处理 Kiosk 状态
      if (msgData.kioskStatus) {
        this.handleKioskStatus(msgData.kioskStatus);
      }

      // 处理制作杯数更新
      if (msgData.customerDisplayRecords) {
        this.handleMakingCupNumUpdate(msgData.customerDisplayRecords);
      }
    } catch (error) {
      console.error('ws:onmsg=>JSON.parse', event.data);
    }
  };

  /**
   * 记录 WebSocket 关闭日志（带节流：模块级 + 严格大于间隔才再次上报）
   */
  logWebSocketClose = (message, error = null) => {
    const now = Date.now();
    if (
      lastWsClosePosFrontLogTime !== 0 &&
      now - lastWsClosePosFrontLogTime <= RECONNECT_INTERVAL
    ) {
      return;
    }

    console.log(`%c ${message} ${new Date()}`, 'color: red;');
    posFrontLog(`ws_onclose_sessionKey=${getCookie('sessionKey')}`);

    if (error) {
      console.log('%c ws_e.code_' + JSON.stringify(error), 'color: red;');
      posFrontLog(`ws_e.code_${JSON.stringify(error)}`);
    }

    lastWsClosePosFrontLogTime = now;
  };

  /**
   * 清理 WebSocket 相关资源
   */
  cleanupWebSocketResources = () => {
    window.kioskWs = this.ws = null;
    this.props.setConnectWs(false);

    if (this.heartBeatTimer) {
      clearInterval(this.heartBeatTimer);
      this.heartBeatTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  };

  /**
   * 处理 WebSocket 连接关闭事件
   */
  handleWebSocketClose = (event) => {
    const closedWs = event.target;
    if (closedWs !== this.ws) {
      return;
    }

    this.logWebSocketClose('ws断开=> onclose', event.code === 1003 ? event : null);
    this.cleanupWebSocketResources();

    // 启动重连定时器
    this.reconnectTimer = setTimeout(
      this.callWebSocketTimer,
      RECONNECT_INTERVAL
    );
    this.WS.timer = true;
    console.log('%c ws:重连=> tryConnect', 'color: orange;');
  };

  /**
   * 尝试建立 WebSocket 连接
   */
  tryConnect = () => {
    // 只有在连接已关闭或未连接时才创建新连接
    if (this.ws == null || this.ws.readyState === WebSocket.CLOSED) {
      const wsUrl = this.getWebSocketUrl();
      
      // window.kioskWs 用于刷新 session key 时，先断连 ws
      window.kioskWs = this.ws = new WebSocket(wsUrl);
      
      // 重置心跳状态
      this.everysec.serverbeat = 0;
      this.everysec.beattimer = 0;

      // 绑定事件处理器
      this.ws.onopen = this.handleWebSocketOpen;
      this.ws.onmessage = this.handleWebSocketMessage;
      this.ws.onclose = this.handleWebSocketClose;
    } else {
      // 如果连接已存在但未关闭，等待后重试
      if (!this.ws) {
        setTimeout(this.tryConnect, WS_CONNECT_DELAY);
      }
    }
  };

  /**
   * 初始化 WebSocket 连接
   */
  callWebSocket = () => {
    // 防止重复连接
    if (this.WS.timer) {
      return;
    }

    // 如果已有连接且处于连接中或已连接状态，先关闭
    if (
      this.ws != null &&
      (this.ws.readyState === WebSocket.CONNECTING ||
        this.ws.readyState === WebSocket.OPEN)
    ) {
      this.ws.close();
    }

    // 开始尝试连接
    if (!this.ws) {
      this.tryConnect();
    }
  };

  /**
   * 初始化心跳机制
   */
  initHeartBeat = () => {
    this.everysec = {
      serverbeat: 0,
      beattimer: 0,
      beatinterval: HEARTBEAT_INTERVAL,
    };
    this.heartBeatTimer = setInterval(this.heartBeat, 1000);
  };

  /**
   * 发送心跳消息
   */
  sendHeartbeat = () => {
    if (
      this.ws &&
      this.ws.readyState === WebSocket.OPEN &&
      this.props.isConnectWs
    ) {
      judgeSskeyIsActiveTime().then(() => {
        this.ws.send(
          JSON.stringify({
            heartbeatType: 'F',
            sessionKey: getCookie('sessionKey'),
          })
        );
      });
    }
  };

  /**
   * 心跳定时器回调
   * 每秒执行一次，按间隔发送心跳
   */
  heartBeat = () => {
    this.everysec.beattimer++;
    this.everysec.serverbeat++;

    // 达到心跳间隔时发送心跳
    if (this.everysec.beattimer >= this.everysec.beatinterval) {
      this.everysec.beattimer = 0;
      this.sendHeartbeat();
    }

    // 超过重置阈值时重置计数器
    if (this.everysec.serverbeat > HEARTBEAT_RESET_THRESHOLD) {
      this.everysec.serverbeat = 0;
      this.everysec.beattimer = 0;
    }
  };

  /**
   * 初始化 WebSocket 连接
   * 检查必要条件后建立连接
   */
  initWS = () => {
    const { isConnectWs } = this.props;
    const kioskLicense = getCookie('kioskLicense');
    const sessionKey = getCookie('sessionKey');

    if (!this.ws && !isConnectWs && kioskLicense && sessionKey) {
      judgeSskeyIsActiveTime().then(() => this.callWebSocket());
    }
  };

  /**
   * 更新菜单数据
   */
  updateMenuData = async () => {
    try {
      const menuRes = await fetchMenuGroup();
      const menuGroups = menuRes.data.KioskMenus[0].menuGroups;
      if (menuGroups?.length) {
        const updatedMenuGroupWithStock = await this.props.initMenuGroup2(
          menuRes.data
        );
        posFrontLog(
          `WebSocket updated out-of-stock items: ${JSON.stringify(
            getOutOfStockItems(updatedMenuGroupWithStock)
          )}`
        );
        posFrontLog(
          `WebSocket updated items with stock quantity: ${JSON.stringify(
            getItemsWithStockNum(updatedMenuGroupWithStock)
          )}`
        );
        posFrontLog(
          `WebSocket Kiosk config sold-out items: ${JSON.stringify(
            this.props.selfConfig?.soldOut || []
          )}`
        );
      }
    } catch (error) {
      console.error('更新菜单数据失败:', error);
    }
  };

  /**
   * 更新系统配置数据
   */
  updateSystemConfig = async () => {
    try {
      const [
        systemConfigRes,
        taxInfoRes,
        itemSizeListRes,
        systemConfigAllListRes,
        marginAppConfigRes,
      ] = await Promise.all([
        fetchSystemConfig(),
        fetchTaxInfo(),
        fetchItemSizeList(),
        fetchSystemConfigAllList(),
        getMarginappFetchConfig(),
      ]);

      // 更新基础配置参数
      this.props.initConfigParams(
        systemConfigRes.data,
        taxInfoRes.data,
        itemSizeListRes.data,
        systemConfigAllListRes.data
      );

      // 更新 Kiosk 自定义配置
      if (marginAppConfigRes.data.result.successful) {
        const kioskConfig = marginAppConfigRes.data.marginAppConfigTypes.find(
          (config) => config.product === 'KIOSKLITE'
        );

        if (kioskConfig) {
          const configMap = JSON.parse(kioskConfig.data);
          this.props.setSelfConfig(configMap);
        }
      }
    } catch (error) {
      console.error('更新系统配置失败:', error);
    }
  };

  /**
   * 更新配置和菜单
   * 当收到菜单更新消息时调用
   */
  updateConfigMenu = (fullUpdate) => {
    this.props.setIsMenuUpdated(false);
    
    // 并行更新菜单和配置
    this.updateMenuData();
    if (fullUpdate) {
      this.updateSystemConfig();
    }
  };

  /**
   * 清理所有资源
   * 用于组件卸载和页面关闭时
   */
  cleanupAllResources = () => {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.heartBeatTimer) {
      clearInterval(this.heartBeatTimer);
      this.heartBeatTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  };

  handleKioskLicenseReady = () => {
    this.trackedKioskLicense = getCookie('kioskLicense');
    this.initWS();
  };

  syncKioskLicenseAndInitWS = () => {
    const kioskLicense = getCookie('kioskLicense');
    if (kioskLicense && kioskLicense !== this.trackedKioskLicense) {
      this.trackedKioskLicense = kioskLicense;
      this.initWS();
    } else if (kioskLicense && !this.ws && !this.props.isConnectWs) {
      this.initWS();
    }
  };

  componentDidMount() {
    this.syncKioskLicenseAndInitWS();
    EventBus.on('kiosk_license_ready', this.handleKioskLicenseReady);

    // 页面关闭前清理资源
    window.onbeforeunload = this.cleanupAllResources;
  }

  componentDidUpdate() {
    this.syncKioskLicenseAndInitWS();
  }

  componentWillUnmount() {
    EventBus.off('kiosk_license_ready');
    this.cleanupAllResources();
  }

  render() {
    return null;
  }
}

function mapStateToProps(state) {
  return {
    isConnectWs: state.socket.isConnectWs,
    selfConfig: state.selfConfig,
  };
}

export default connect(mapStateToProps, {
  setConnectWs,
  setIsMenuUpdated,
  setMakingCupNum,
  initMenuGroup2,
  initConfigParams,
  setFreeItemMenuPosition,
  setSelfConfig,
})(SocketPage);
