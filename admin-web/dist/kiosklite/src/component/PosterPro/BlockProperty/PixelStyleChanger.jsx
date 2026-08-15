import { Col, Row, InputNumber, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { getCssValue } from '@/utils/';

const PixelStyleChanger = (props) => {
  const { cssKey, data, onChange } = props;
  const { t } = useTranslation();

  const changeBlockWidth = (newStyle) => {
    onChange(newStyle);
  };

  return (
    <Space direction="vertical" size={8}>
      {cssKey.map((key, i) => {
        return (
          <Row align="middle" key={i}>
            <Col span={10}>{t(`style.${key}`)}:</Col>
            <Col span={14}>
              <InputNumber
                value={getCssValue(data.style[key])}
                step={data.step || 1}
                min={getCssValue(data?.min?.[key]) || 0}
                max={getCssValue(data?.max?.[key]) || 9999}
                onChange={(v) => {
                  if (v == null) return;
                  changeBlockWidth({ [key]: v });
                }}
                addonAfter="px"
              />
            </Col>
          </Row>
        );
      })}
    </Space>
  );
};

export default PixelStyleChanger;
