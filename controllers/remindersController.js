const Visit = require("../models/Visit");
const agenda = require("../config/agenda");
const Pet = require("../models/pet");
const { DateTime } = require("luxon");
const nodemailer = require("nodemailer");
const ScheduledVisit = require("../models/scheduledVisit");

agenda.define("send email", async (job) => {
  const details = job.attrs.data;

  var subject = "Reminder for Visit";

  var message = `Hii ${
    details?.ownerName
  } This is reminder for the visit scheduled for your pet.Details of the visit are -\n
               Pet name : ${details?.petName || ""}\n
               Species :${details?.species || ""}\n
               Breed :${details?.breed || ""}\n
               Date :${details?.date || ""}\n
               Time :${details?.time}`;

  const auth = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    port: 465,
    auth: {
      user: process.env.GMAIL_ACCOUNT,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const receiver = {
    from: process.env.GMAIL_ACCOUNT,
    to: details?.email,
    subject: subject,
    text: message,
  };

  auth.sendMail(receiver, (err, emailResponse) => {
    if (err) console.log(err);
    console.log(emailResponse);
    job.remove();
  });
});

agenda.define("birthday email", async (job) => {
  const details = job.attrs.data;

  var subject = `Happy Birthday to ${details?.petName}`;

  var message = `Hii ${details?.ownerName}\n
   Just wanted to take a moment to wish a very happy birthday to ${details?.petName} 🎂🐾 We hope today is filled with all the things ${details?.petName}
   loves most — whether it's extra treats, fun playtime, or some special pampering.\n
   Once again a very happy birthday to ${details?.petName} 🐾🎉
   `;

  const auth = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    port: 465,
    auth: {
      user: process.env.GMAIL_ACCOUNT,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const receiver = {
    from: process.env.GMAIL_ACCOUNT,
    to: details?.email,
    subject: subject,
    text: message,
  };

  auth.sendMail(receiver, (err, emailResponse) => {
    if (err) console.log(err);
    console.log(emailResponse);
    job.remove();
  });
});

agenda.define("send overdue email", async (job) => {
  const details = job.attrs.data;

  var subject = `Missed followup`;
  var message = `
  <html>
    <body style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
      <p>Hii ${details?.ownerName}</p>
      <p>You missed the followup scheduled for your pet ${details?.name} on ${details?.date}.</p>
      <p><strong>Purpose:</strong> ${details?.purpose}</p>
      <p>Please contact the staff for any further communication.</p>
    </body>
  </html>
`;

  const auth = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    port: 465,
    auth: {
      user: process.env.GMAIL_ACCOUNT,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const receiver = {
    from: process.env.GMAIL_ACCOUNT,
    to: details?.email,
    subject: subject,
    html: message,
    headers: {
      "Content-Type": "text/html; charset=UTF-8", // Ensure it's sent as HTML
    },
  };

  auth.sendMail(receiver, (err, emailResponse) => {
    if (err) console.log(err);
    console.log(emailResponse);
    job.remove();
  });
});

exports.sendReminders = async (req, res) => {
  try {
    const { List } = req.body;
    List.forEach((item, index) => {
      agenda.schedule(`in ${index * 5} seconds`, "send email", { item });
    });
    return res.status(200).json({
      success: true,
      message: "Emails will be sent successfully",
    });
  } catch (error) {
    console.log("Error in getVisitController", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.sendBirthdayReminders = async (req, res) => {
  try {
    const { list } = req.body;
    list.forEach((item, index) => {
      agenda.schedule(`in ${index * 5} seconds`, "birthday email", { item });
    });
    return res.status(200).json({
      success: true,
      message: "Emails will be sent successfully",
    });
  } catch (error) {
    console.log("Error in sendBirthdayReminder Controller", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.sendOverdueReminders = async (req, res) => {
  try {
    const { date } = req.body;

    if (!date) {
      return res.json({
        success: false,
        message: "Reminders can't be send without choosing a date",
      });
    }

    const TempDate = new Date(date);

    const FollowUpList = await ScheduledVisit.find({
      date: TempDate,
    }).populate({
      path: "petId",
      populate: {
        path: "owner",
      },
    });

    FollowUpList.forEach((item,index) => {
      if (item?.present === false) {
        const obj = {};
        obj["name"] = item?.petId?.name;
        obj["ownerName"] = item?.petId?.owner?.name;
        obj["purpose"] = item?.purpose;
        obj["scheduledDate"] = item?.date;
        obj["email"] = item?.petId?.owner?.email;
        agenda.schedule(`in ${index * 5} seconds`, "send overdue email", obj);
      }
    });

    return res.status(200).json({
      success: true,
      message: "Emails will be sent successfully",
    });
  } catch (error) {
    console.log("Error in sendoverduereminders Controller", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getRemindersList = async (req, res) => {
  try {
    const { date } = req.params;
    const TempDate = new Date(date);

    const FollowUpList = await ScheduledVisit.find({
      date: TempDate,
    }).populate({
      path: "petId",
      populate: {
        path: "owner",
      },
    });

    let birthdayDate = new Date(date);

    let month = birthdayDate.getMonth() + 1;
    let day = birthdayDate.getDate();

    const BirthdayList = await Pet.find({
      $expr: {
        $and: [
          { $eq: [{ $month: "$dob" }, month] },
          { $eq: [{ $dayOfMonth: "$dob" }, day] },
        ],
      },
    }).populate({
      path: "owner",
      select: "name phone",
    });

    const combinedList = [];
    FollowUpList.forEach((item) => {
      const obj = {};
      obj["petName"] = item?.petId?.name;
      obj["ownerName"] = item?.petId?.owner?.name;
      obj["contact"] = item?.petId?.owner?.phone;
      obj["purpose"] = item?.purpose;
      obj["scheduledDate"] = item?.date;

      combinedList.push(obj);
    });

    BirthdayList.forEach((item) => {
      const obj = {};
      obj["petName"] = item?.name;
      obj["ownerName"] = item?.owner?.name;
      obj["contact"] = item?.owner?.phone;
      obj["purpose"] = "Birthday";
      combinedList.push(obj);
    });

    return res.status(200).json({
      success: true,
      List: combinedList,
      message: "List fetched successfully",
    });
  } catch (error) {
    console.log("Error in getRemindersList Controller", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.sendRemindersNew = async (req, res) => {
  try {
    const { date } = req.params;
    const TempDate = new Date(date);

    const FollowUpList = await ScheduledVisit.find({
      date: TempDate,
    }).populate({
      path: "petId",
      populate: {
        path: "owner",
        select: "email name",
      },
    });

    FollowUpList.forEach((item, index) => {
      const obj = {};
      obj["petName"] = item?.petId?.name;
      obj["ownerName"] = item?.petId?.owner?.name;
      obj["email"] = item?.petId?.owner?.email;
      obj["purpose"] = item?.purpose;
      obj["date"] = date;
      obj["time"] = item?.time;
      obj["species"] = item?.petId?.species;
      obj["breed"] = item?.petId?.breed;
      agenda.schedule(`in ${index * 5} seconds`, "send email", obj);
    });

    let birthdayDate = new Date(date);

    let month = birthdayDate.getMonth() + 1;
    let day = birthdayDate.getDate();

    const BirthdayList = await Pet.find({
      $expr: {
        $and: [
          { $eq: [{ $month: "$dob" }, month] },
          { $eq: [{ $dayOfMonth: "$dob" }, day] },
        ],
      },
    }).populate({
      path: "owner",
      select: "name email",
    });

    BirthdayList.forEach((item, index) => {
      const obj = {};
      obj["petName"] = item?.name;
      obj["ownerName"] = item?.owner?.name;
      obj["email"] = item?.owner?.email;
      agenda.schedule(`in ${index * 5} seconds`, "birthday email", obj);
    });

    return res.status(200).json({
      success: true,
      message: "Emails will be sent successfully",
    });
  } catch (error) {
    console.log("Error in sendReminders Controller", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
