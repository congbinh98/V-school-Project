const { body, validationResult } = require('express-validator');
require('dotenv').config();

module.exports.checkFormNotification = [
    body('invoiceIds')
    .notEmpty()
    .withMessage("Danh sách hóa đơn không được rỗng!"),
    body('type')
    .isIn(["TUITION", "COMMON"])
    .withMessage("Loại thông báo không đúng!"),
    body('content')
    .isLength({ min: 1, max: 200 })
    .withMessage("Nội dung không được rỗng và không quá 200 từ!"),



]
module.exports.checkFormSetRead = [
    body('ids')
    .notEmpty()
    .withMessage("Bạn chưa chọn thông báo nào!"),
]



module.exports.checkForError = function(req, res, next) {
    const simpleValidationResult = validationResult.withDefaults({
        formatter: (err) => err.msg,
    })
    const errors = simpleValidationResult(req);
    if (!errors.isEmpty()) {

        return res.status(400).json({
            ok: false,
            message: errors.mapped()
        })
    }
    next();
}

// module.exports.checkTokenNoti = (req, res, next) => {
//     let token = req.header('Authentication');

//     const data = jwt.verify(token, process.env.secretOrKey, (err, decoded) => {
//         if (err) {
//             console.log(err);
//             res.json({
//                 ok: false,
//                 message: "Invalid token"
//             });
//         } else {
//             token = token.split("SPayment ")[1];
//             next()
//         }
//     });
// }