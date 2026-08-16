import React, { useRef } from 'react'
import { Typography, Box } from '@material-ui/core'
import { alpha, makeStyles } from '@material-ui/core/styles'
import { CheckRounded } from '@material-ui/icons'
import { useTranslation } from 'react-i18next'
import PriceList from './PriceList'
import OptionList from './OptionList'
import SeasoningBlock from './SeasoningBlock'
import TextAreaField from '../common/TextAreaField'
import KeyBoardInstance from '@/utils/KeyBoardBounce'
import VipPriceWithImg from '@/components/common/VipPriceWithImg'

const useStyles = makeStyles((theme) => ({
  wrapper: {
    height: '100%',
  },
  form: {
    // width: 500,
    // maxWidth: 500,
    // height: '100%',
    maxHeight: 615,
    overflowY: 'auto',
    '&::-webkit-scrollbar': {
      width: 0,
      height: 0,
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.grey.A200,
    },
    '&::-webkit-scrollbar-thumb': {
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.primary.main,
    },
    padding: theme.spacing(4),
    [theme.breakpoints.up('md')]: {
      maxWidth: 500,
      minWidth: 400,
    },
    [theme.breakpoints.down('sm')]: {
      maxWidth: `calc(100vw - ${theme.spacing(10)}px)`,
    },
  },
  optionLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    lineHeight: 1.2,
    fontWeight: 700,
    marginBottom: 4,
  },
  optionLabelWrapper: {
    marginBottom: theme.spacing(2),
  },
  labelDot: {
    display: 'inline-block',
    width: 18,
    height: 18,
    borderRadius: '50%',
    backgroundColor: theme.palette.secondary.main,
  },
  optionButton: {
    minWidth: '100%',
    width: '100%',
    height: 50,
    fontSize: 16,
    color: '#4F4F4F',
    borderRadius: 15,
    boxShadow: 'none',
    backgroundColor: alpha(theme.palette.common.white, 0.5),
    '&:not(:last-child)': {
      marginBottom: theme.spacing(2),
    },
    '&:hover': {
      boxShadow: 'none',
      backgroundColor: alpha(theme.palette.common.white, 0.5),
    },
    '&.active': {
      boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
      backgroundColor: theme.palette.common.white,
    },
    '&.disabled': {
      opacity: 0.5,
    },
  },
}))

const RightPanel = ({
  data,
  count,
  pricesList,
  fixedSelection,
  optionsList,
  priceItem,
  options,
  instructions,
  changePrice,
  changeOptions,
  setInstructions,
  combo,
  isShowDisplayNote,
  checkDish,
  hidePrice = false,
  showSeasoning = false,
  seasoningGroups = [],
  seasoningSelections = [],
  onToggleSeasoning,
}) => {
  const classes = useStyles()
  const { t } = useTranslation(['translation', 'dish', 'option'])
  const textRef = useRef(null)

  function renderPriceLabel() {
    return (
      <Typography variant="h6" component="h6" className={classes.optionLabel}>
        <Box display="inline-flex" alignItems="baseline">
          <Box component="strong" display="flex" alignItems="center">
            <i className={classes.labelDot}></i>
            <Box
              component="span"
              marginLeft={-1}
              style={{ maxWidth: '200px', wordBreak: 'break-word' }}
            >
              {t('DishDialog.price_label')}
            </Box>
          </Box>
        </Box>
      </Typography>
    )
  }

  function renderOptionLabel(item, idx) {
    const count = options?.[idx]?.reduce((acc, cur) => acc + cur.count, 0) ?? 0
    const valid = count >= (item?.min ?? 0)
    const text = t(item.id, {
      defaultValue: null,
      ns: item.type === 'combo' ? 'comboSection' : 'option',
    })

    const label = text
      ? text
      : item.label === 'season'
        ? t('Option.season')
        : item.label
    return (
      <Typography
        variant="h6"
        component="h6"
        className={classes.optionLabelWrapper}
      >
        <Box className={classes.optionLabel}>
          <Box display="inline-flex" alignItems="center">
            <Box component="strong" display="flex" alignItems="center">
              <i className={classes.labelDot}></i>
              <Box
                component="span"
                marginLeft={-1}
                style={{ maxWidth: '200px', wordBreak: 'break-word' }}
              >
                {label}
              </Box>
            </Box>
            {!hidePrice && (
              <Box
                component="span"
                fontSize={14}
                color="#828282"
                marginLeft={1}
              >
                {item.price ? `$${item.price?.toFixed(2)}` : null}
              </Box>
            )}
            {!hidePrice && typeof item.benefitPrice === 'number' && (
              <VipPriceWithImg
                style={{ marginLeft: 4 }}
                benefitPrice={`$${item.benefitPrice?.toFixed(2)}`}
              />
            )}
            {!hidePrice &&
              item.strikethroughPrice !== undefined &&
              item.strikethroughPrice != null && (
                <span
                  style={{
                    color: 'gray',
                    marginLeft: '5px',
                    fontSize: '12px',
                    textDecoration: 'line-through',
                  }}
                >
                  ${item.strikethroughPrice.toFixed(2)}
                </span>
              )}
          </Box>
          <Box
            component="span"
            display="flex"
            alignItems="center"
            color="textSecondary"
            fontWeight="normal"
          >
            <Box
              component="span"
              padding={'1px 4px'}
              fontSize={14}
              color="#4F4F4F"
              borderRadius={5}
              style={{
                color: item.required && !valid ? '#ff4d4f' : '#4F4F4F',
              }}
            >
              {t(
                item.required
                  ? 'DishDialog.option_required'
                  : 'DishDialog.option_optional'
              )}
            </Box>
            {valid && <CheckRounded fontSize="small" color="primary" />}
          </Box>
        </Box>
        <Box fontSize={12} fontWeight={500} color="#4F4F4F" paddingLeft={1}>
          {getRangeText(item.min, item.max, item.freeQuantity)}
        </Box>
      </Typography>
    )
  }

  function getRangeText(min, max, freeQuantity) {
    let strList = []

    if (min > 0 && !(max > 0)) {
      strList.push(t('DishDialog.option_min', { min }))
    } else if (!(min > 0) && max > 0) {
      strList.push(t('DishDialog.option_max', { max }))
    } else if (min > 0 && max > 0 && min === max) {
      strList.push(t('DishDialog.option_equal', { value: min }))
    } else if (min > 0 && max > 0 && min < max) {
      strList.push(t('DishDialog.option_range', { min, max }))
    }

    if (freeQuantity > 0 && freeQuantity < Number.MAX_SAFE_INTEGER) {
      strList.push(t('DishDialog.option_free', { count: freeQuantity }))
    }

    return strList.join('. ')
  }

  const onHandleWrapperClick = (event) => {
    const checkDishRes = checkDish()
    if (!checkDishRes) {
      event.stopPropagation()
    }
  }

  return (
    <div className={classes.wrapper} onClickCapture={onHandleWrapperClick}>
      <form className={classes.form}>
        {/* 详情价 */}
        {pricesList.length > 1 && (
          <Box marginBottom={4}>
            {renderPriceLabel()}
            <PriceList
              pricesList={pricesList}
              priceItem={priceItem}
              changePrice={changePrice}
              combo={combo}
              count={count}
              data={data}
              hidePrice={hidePrice}
            />
          </Box>
        )}
        {/* option, 子菜组 */}
        {optionsList.map((item, idx) => (
          <Box key={idx} marginBottom={4}>
            {renderOptionLabel(item, idx)}
            <OptionList
              fixedSelection={fixedSelection}
              optionItem={item}
              optionIndex={idx}
              options={options}
              changeOptions={changeOptions}
              hidePrice={hidePrice}
            />
          </Box>
        ))}
        {showSeasoning ? (
          <SeasoningBlock
            groups={seasoningGroups}
            selections={seasoningSelections}
            onToggleChoice={onToggleSeasoning}
          />
        ) : null}
        <Box hidden={!isShowDisplayNote}>
          <Typography
            variant="h6"
            component="h6"
            className={classes.optionLabel}
          >
            {t('Order.add_instructions_title')}
          </Typography>
          <TextAreaField
            inputRef={textRef}
            fullWidth
            multiline
            minRows={4}
            maxRows={4}
            inputProps={{
              maxLength: 150,
            }}
            variant="outlined"
            placeholder={t('DishDialog.option_note_placeholder')}
            defaultValue={instructions}
            onFocus={() => {
              KeyBoardInstance.checkIfNeedBounce(textRef.current)
            }}
            onBlur={() => {
              KeyBoardInstance.removeBoxFromBody()
            }}
            onInput={(e) => setInstructions(e.target.value)}
          />
        </Box>
      </form>
    </div>
  )
}

export default RightPanel
