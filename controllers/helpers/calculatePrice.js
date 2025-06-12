const Price=require("../../models/price")

exports.calculateInquiryPrice = () => {
  return 0;
};

exports.calculateDogParkPrice = async(details,purpose) => {
  const { discount } = details;

  const price=await Price.find({purpose});

  if (price?.originalPrice >= discount) return price?.originalPrice - discount;
  else{
    
  }
};

exports.calculateDogCarePrice = (details) => {
  const { originalPrice, discount } = details;
  if (originalPrice > discount) return originalPrice - discount;
  return 0;
};

exports.checkGroomingPrice = (details) => {
    const { originalPrice, discount } = details;
    if (originalPrice > discount) return originalPrice - discount;
    return 0;
};

exports.checkShopDetails = (details) => {
  const { products } = details;
  let price=0;
  for (item in products) {
    if (!item?.name || !item?.price) return false;
  }
  return true;
};

exports.checkSubscriptionDetails = (details) => {
  const { subscriptionType, petId, days } = details;
  if (!subscriptionType || !petId || !days) return false;
  return true;
};

exports.checkHostelDetails = (details) => {
  const { subscriptionAvailed, originalPrice, discount, price } = details;
  if (subscriptionAvailed == true) return true;

  if (!originalPrice || !discount || !price) return false;

  return true;
};

exports.checkDaySchoolDetails = (details) => {
  const { subscriptionAvailed, originalPrice, discount, price } = details;
  if (subscriptionAvailed == true) return true;

  if (!originalPrice || !discount || !price) return false;

  return true;
};

exports.checkPlaySchoolDetails = (details) => {
  const { subscriptionAvailed, originalPrice, discount, price } = details;
  if (subscriptionAvailed == true) return true;

  if (!originalPrice || !discount || !price) return false;

  return true;
};
