const express = require("express");
const cors = require("cors");
const agenda = require("./config/agenda");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const petRoutes = require("./routes/petRoutes");
const visitRoutes = require("./routes/visitRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const subscriptionRoutes=require("./routes/subscriptionRoutes");
const boardingRoutes=require("./routes/boardingRoutes")
const paymentRoutes=require("./routes/paaymentroutes")
const customerServicesRoutes=require("./routes/CustomerServiceRoutes")
const customerAppointment = require("./routes/CustomerAppointmentroutes")
const onlineCustomer = require("./routes/OnlineCustomerRoutes");

const app = express();


app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization","Accept-Type"],
  })
);


const dbConnect = require("./config/db");
dbConnect();
agenda.start().then(() => {
  console.log("Agenda is working");
});




//routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/pet", petRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/visit", visitRoutes);
app.use("/api/v1/reminders", reminderRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/subscription",subscriptionRoutes);
app.use("/api/v1/boarding",boardingRoutes);
app.use("/api/v1/payments",paymentRoutes);
app.use("/api/v1/customerservices",customerServicesRoutes);
app.use("/api/v1/customerappointment",customerAppointment);
app.use("/api/v1/appointment",onlineCustomer);


// Start Server
const PORT = process.env.PORT || 5000;

app.get("/",(req,res)=>{
  res.send(process.env.FRONTEND_URL)
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


