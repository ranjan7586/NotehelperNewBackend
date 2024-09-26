const express = require("express");
const app = express();
const path = require("path")
const errMiddleware = require("./middleware/error");
// const cors=require("cors");
const cors = require('cors');
app.use(express.json());
//route import
const allowedOrigins = ['https://notehelper02.onrender.com','http://localhost:3000',*]; // Add your website's domain here

// /*
const corsOptions = {
    origin: function (origin, callback) {
        console.log('Origin:', origin); // Debugging
        if (!origin) {
            return callback(new Error('Sorry! Access Denied'), false);
        }
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
// */
const noteRoute = require("./Routes/productRoute");
const userRoute = require("./Routes/userRoute");
const domainRoute = require("./Routes/domainRoute");
const userUploadRoute = require("./Routes/userUploadRoute");
const allowCrossDomain = require("./middleware/corsError");
const feedbackRoute = require("./Routes/feedbackRoute")
const contactRoute = require("./Routes/contactRoute")
app.use("/api/v1", noteRoute);

app.use("/api/v1", userRoute);
app.use("/api/v1", domainRoute);
app.use("/api/v1", userUploadRoute);
app.use("/api/v1", feedbackRoute);
app.use("/api/v1", contactRoute);
app.use(allowCrossDomain);
// app.use(cors({
//     origin: "http://localhost:3300"
// }));
app.use(errMiddleware);
let count=0;
app.get('/api/v1/img', (req, res) => {
    res.send('<img src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png">');
    console.log("Hello BRo Success");
    count++;
    console.log(count);
});

// app.use(express.static(path.join(__dirname, "../frontend/build")));

// app.use('*', function (req, res) {
//     res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
// })

// if(process.env.NODE_ENV=="production"){
//     app.use(express.static("frotend/build"));
//     app.get('*',function(req,res){
//             res.sendFile(path.resolve(__dirname,'frontend','build','index.html'));
//         })
// }

module.exports = app;
