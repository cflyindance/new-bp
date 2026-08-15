export const getTemplateAction = ({ template }) => {
  const benefits = template.ruleExpression && template.ruleExpression.benefits;
  return (
    benefits &&
    benefits[benefits.length - 1] &&
    benefits[benefits.length - 1].actions &&
    benefits[benefits.length - 1].actions[
      benefits[benefits.length - 1].actions.length - 1
    ]
  );
};

export const isCampaignInTypes = ({ template, types }) => {
  return types.includes(template.type);
};
