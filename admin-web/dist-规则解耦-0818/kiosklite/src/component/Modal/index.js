import { Modal as AntModal } from 'antd';
import React, { cloneElement } from 'react';
import ReactDom from 'react-dom';
import AntdWrapper from '../AntdWrapper';

const getDefaultKey = () => Math.random().toString(36).substr(2);

const nodes = {};

const container = document.body;

const unmount = (key) => {
  const node = nodes[key];
  if (node) {
    ReactDom.unmountComponentAtNode(node);
    container.removeChild(node);
  }
  delete nodes[key];
};

const close = (key) => {
  if (key) return unmount(key);
  Object.keys(nodes).forEach(unmount);
};

const loadModal = async (children, options) => {
  const key = getDefaultKey();
  const node = document.createElement('div');
  nodes[key] = node;
  container.appendChild(node);

  return new Promise((resolve) => {
    const onClose = (data) => {
      resolve(data);
      close(key);
      options?.onCancel?.();
    };

    ReactDom.render(
      <AntdWrapper>
        <AntModal open onCancel={() => onClose()} {...options}>
          {cloneElement(children, { onClose })}
        </AntModal>
      </AntdWrapper>,
      node
    );
  });
};

const loadDrawer = async (children) => {
  const key = getDefaultKey();
  const node = document.createElement('div');
  nodes[key] = node;
  container.appendChild(node);

  return new Promise((resolve) => {
    const onClose = (data) => {
      resolve(data);
      close(key);
    };

    ReactDom.render(
      <AntdWrapper>
        {cloneElement(children, { onClose, open: true })}
      </AntdWrapper>,
      node
    );
  });
};

const Modal = {
  loadModal,
  loadDrawer,
};

export default Modal;
