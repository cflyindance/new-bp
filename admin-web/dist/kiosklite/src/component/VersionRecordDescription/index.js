import React from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeKioskVersionSegment } from '@/utils/kioskVersionRecord';
import styles from './index.module.scss';

function VersionRecordDescription({ selfConfig }) {
  const { t } = useTranslation();
  const kv = selfConfig?.kioskVersion;
  const rows = [];

  if (kv && typeof kv === 'object' && !Array.isArray(kv)) {
    ['current', 'pre', 'pre2'].forEach((slot) => {
      const seg = normalizeKioskVersionSegment(kv[slot]);
      if (seg.version) {
        rows.push({ slot, version: seg.version, updateTime: seg.updateTime });
      }
    });
  }

  if (!rows.length) {
    return <div>{t('version_record_empty')}</div>;
  }

  return (
    <div className={styles.versionRecordList}>
      {rows.map(({ slot, version, updateTime }, index) => (
        <div
          key={slot}
          className={`${styles.versionRecordRow} ${index === 0 && styles.versionRecordCurrent}`}
        >
          {`${t('version_record_version_label')}: ${version}; ${t('version_record_update_time_label')}: ${updateTime || '-'}`}
        </div>
      ))}
    </div>
  );
}

export default VersionRecordDescription;
