
exports.checkInquiryDetails = (details) => {
  const { notes, price } = details;
  if (!notes || !price) return false;
  return true;
};

exports.checkDogParkDetails = (details) => {
  const { originalPrice, discount, price} = details;
  if (!originalPrice || !discount || !price) return false;
  return true;
};

exports.checkDayCareDetails = (details) => {
  const { originalPrice, discount, price } = details;
  if (!originalPrice || !discount || !price) return false;
  return true;
};

exports.checkGroomingDetails=(details)=>{
    const { originalPrice, discount, price } = details;
    if (!originalPrice || !discount || !price) return false;
    return true;
}

exports.checkShopDetails=(details)=>{
    const { products } = details;
    for(item in products){
        if(!item?.name||!item?.price)
        return false;    
    }
    return true;
}

exports.checkSubscriptionDetails=(details)=>{
    const { subscriptionType, petId, days } = details;
    if (!subscriptionType || !petId || !days) return false;
    return true;
}

exports.checkHostelDetails=(details)=>{
 const {subscriptionAvailed,originalPrice,discount,price}=details;
 if(subscriptionAvailed==true)
 return true;
 
 if(!originalPrice||!discount||!price)
 return false;

 return true;
}

exports.checkDaySchoolDetails=(details)=>{
    const {subscriptionAvailed,originalPrice,discount,price}=details;
    if(subscriptionAvailed==true)
    return true;
    
    if(!originalPrice||!discount||!price)
    return false;
   
    return true;
}

exports.checkPlaySchoolDetails=(details)=>{
    const {subscriptionAvailed,originalPrice,discount,price}=details;
    if(subscriptionAvailed==true)
    return true;
    
    if(!originalPrice||!discount||!price)
    return false;
   
    return true;
}


