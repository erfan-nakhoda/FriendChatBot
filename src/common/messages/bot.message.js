const BotMessages = Object.freeze({
    notifyExpiredMem: "دو دقیقه به پایان رسید متاسفانه کسی پیدا نشد",
    alreadyInChat: "!... شما در حال حاضر در حال چت هستید",
    alreadySearching: "چند بار میزنی دارم برات میگردم دیگه",
    notEnoughCoin: "سکه شما کافی نمی باشد هر چت 2 سکه نیاز دارد",
    queue: "لطفا کمی منتظر بمانید تا کسی پیدا شود",
    foundMatch: 'ی کاربر برات پیدا کردم بهش سلام کن',
    closeChat: user => `به اتمام رسید ${user}چت شما توسط`,
    whatCanIDo: "چه کاری از دستم بر میاد؟",
    abandonMessage: "متوجه نشدم؟",
    changeCity: "لطفا شهر جدید خود را وارد کنید",
    changeAge: 'لطفا سن جدید خود را وارد کنید',
    changeName: 'لطفا نام جدید خود را وارد کنید',
    changeProfile : 'لطفا عکس مورد نظر خود را ارسال کنید',
    chatReqNotFound: 'درخواست چتی ثبت نشده',
    successChange: item => `شما با موفقیت ویرایش شد ${item}`,
    enterAgeNum : 'لطفا سن خود را به عدد بنویسید',
    enterAgeInRange : "لطفا سن خود را در محدوده مجاز وارد کنید",
    enterName : "لطفا نام خود را وارد کنید",
    enterCity : 'شهر که درآن سکونت دارید را وارد کنید',
    successSave : "تبریک اطلاعات شما با موفقیت ثبت شد",
    ProfileUploaded : "پروفایل شما با موفقیت ثبت شد"
})

const BotData = Object.freeze({
    buyCoin: {
        amount: 10000,
        title: "خرید سکه",
        description: "پس از پرداخت سکه به حساب شما اضافه می شود",
        currency: "IRR",
        label: "خرید سکه"
    }
})
module.exports = { BotMessages, BotData }