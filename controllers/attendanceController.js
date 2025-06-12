const Attendance = require("../models/attendance");
const ScheduledVisit = require("../models/scheduledVisit");

exports.getAttendanceList = async (req, res) => {
  try {
    const user = req.user;

    const { date } = req.params;
    const queryDate = new Date(date);
    console.log(date);

    const attendance = await Attendance.findOne({
      date: queryDate,
    }).populate({
      path: "List",
      populate: {
        path: "petId",
        populate: {
          path: "owner",
          select: "name phone email",
        },
      },
    });

    if (attendance) {
      return res.status(200).json({
        success: true,
        message: "List fetched successfully",
        attendance,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Invalid data",
      });
    }
  } catch (error) {
    console.log("Error in getAttendance controller", error);
    return res.status(500).json({
      success: "false",
      message: "Internal Server Error",
    });
  }
};

exports.updateAttendanceList = async (req, res) => {
  try {
    const { date, presentIds, absentIds } = req.body;

    if (!date) {
      return res.status(400).json({
        success: "false",
        message: "Can't update attendance",
      });
    }

    const queryDate = new Date(date);

    if (presentIds.length !== 0) {
      await ScheduledVisit.updateMany(
        { _id: { $in: presentIds }, date: queryDate },
        { $set: { present: true } }
      );
    }

    if (absentIds.length !== 0) {
      await ScheduledVisit.updateMany(
        { _id: { $in: absentIds }, date: queryDate },
        { $set: { present: false } }
      );
    }

    const List = await ScheduledVisit.find({
      date: queryDate,
    }).populate({
      path: "petId",
      populate: {
        path: "owner",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      List,
    });
  } catch (error) {
    console.log("Error in getAttendance controller", error);
    return res.status(500).json({
      success: "false",
      message: "Internal Server Error",
    });
  }
};
