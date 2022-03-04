const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();
const jwt = require('jsonwebtoken')

//Initialize on your own serve
const admin = require('firebase-admin');
const serviceAccount = require(process.env.SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Add notis
module.exports.addOne = async(req, res) => {
    try {
        const body = req.body;
        // danh sach cac id muon gui toi
        var invoiceIds = body.invoiceIds;
        const loginAccount = req.user;
        let content = "";
        // số thông báo trên firestore
        let notiFirestore = 0;
        // số thông báo trong db
        let notiDB = 0;
        var invoiceError = [];
        const school = await prisma.school.findUnique({ where: { accountId: loginAccount.id } });
        // Nếu invoiceId có 1 phần tử là ALL
        if (invoiceIds.length === 1 && invoiceIds[0] === "ALL") {
            invoiceIds = [];
            invoiceIds = await prisma.invoice.findMany({
                where: {
                    MST: school.MST
                },
                select: {
                    id: true
                }
            });
            // map array obj to array string
            var invoiceIdTemp = invoiceIds.map(function(item) {
                return item['id']
            });
            invoiceIds = invoiceIdTemp;
        }

        // loại thông báo học phí
        if (body.type === 'TUITION') {
            const checkInvoice = await checkInvoiceOfSchool(invoiceIds, school.MST);
            if (!checkInvoice) {
                return res.json({ ok: false, message: "Có hóa đơn không phải của trường!" });
            }
            // loop theem từng invoiceId
            for (let index = 0; index < invoiceIds.length; index++) {
                const invoiceId = invoiceIds[index];
                var invoiceOfSchool = await prisma.invoice.findUnique({ where: { id: invoiceId } })
                const studentOfInvocie = await prisma.student.findUnique({ where: { BHYT: invoiceOfSchool.BHYT } });
                content = body.content.concat(` ; Số tiền: ${invoiceOfSchool.ammount}`);
                const parents = await prisma.parent.findMany({
                    where: {
                        OR: [
                            { phone: invoiceOfSchool.tel1 },
                            { phone: invoiceOfSchool.tel2 ? invoiceOfSchool.tel2 : "" }
                        ]
                    }
                });
                // có parent
                if (parents.length !== 0) {
                    // thêm từng invoiceId theo từng sđt (TH invoice có 2 sdt)
                    for (let index = 0; index < parents.length; index++) {
                        const parent = parents[index];
                        // noti thêm vào database
                        const notification = await prisma.notification.create({
                            data: {
                                from: school.accountId,
                                to: parent.accountId,
                                type: body.type,
                                content: content,
                                isRead: false
                            },
                        });
                        if (notification) {
                            notiDB++;
                            // add one in firestore
                            async function saveNotification(db) {
                                const FieldValue = admin.firestore.FieldValue;
                                const aNotiRef = db.collection('notifications').doc(`${notification.id}`);

                                await aNotiRef.set({
                                        'from': notification.from,
                                        'to': notification.to,
                                        'type': notification.type,
                                        'content': notification.content,
                                        'isRead': notification.isRead,
                                        'invoiceID': invoiceId,
                                        'studentID': studentOfInvocie.id,
                                        'createAt': FieldValue.serverTimestamp()
                                    })
                                    .then(function() {
                                        console.log("Document written with ID: ", aNotiRef.id);
                                        notiFirestore++;
                                    })
                                    .catch(function(error) {
                                        console.error("Error adding document: ", error);
                                    });

                            };
                            await saveNotification(db);

                            // nếu thêm vào db thất bại
                        } else {
                            console.log('Thêm vào database thất bại')
                            invoiceError.push(invoiceId);
                            continue;
                        }

                    } // kết thúc 1 parent
                }
                // ko tìm thấy parents nào
                else {
                    console.log('Không tìm thấy phụ huynh nào')
                    invoiceError.push(invoiceId);
                    continue;
                }


            } // kết thúc 1 invoiceId
            // console.log(notiFirestore)
            // số thông báo trên firestore phải bằng db trong db, ko có invoice nào lỗi            
            if (notiDB === notiFirestore && invoiceError.length === 0) {
                return res.json({ ok: true, message: "Thêm thông báo thu tiền thành công!" })
            } else if (notiDB === notiFirestore && invoiceError.length !== 0) {
                return res.json({ ok: true, message: "Thêm thông báo có các hóa đơn bị lỗi:", invoiceError: invoiceError });
            } else {
                return res.status(404).json({ ok: false, message: "Thêm thông báo thất bại!" })
            }


        }
        //laoị thông báo COMMON
        else {
            return res.json({ ok: false, message: "Đang cập nhật!" });
        }




    } catch (error) {
        console.log(error);
        return res.status(404).json({ ok: false, message: "Something went wrong" })
    } finally {
        async() =>
        await prisma.$disconnect()
    }
}


// check invoice of school
async function checkInvoiceOfSchool(invoiceIds, mst) {
    try {
        for (let index = 0; index < invoiceIds.length; index++) {
            const element = invoiceIds[index];
            const invoice = await prisma.invoice.findFirst({
                where: {
                    AND: [{
                            id: element
                        },
                        {
                            MST: mst
                        }
                    ]

                }
            });
            if (!invoice) {
                return false;
            }
        }


        return true;
    } catch (error) {
        console.log(error);
        return false;
    } finally {
        async() => {
            await prisma.$disconnect;
        }
    }
}

// set isRead all
module.exports.setIsReadAll = async(req, res) => {
    try {
        const loginAccount = req.user;
        const idOfNotis = req.body.ids;
        // số noti update
        var notiFirestore = 0;

        // neu co truyen ids
        if (idOfNotis.length !== 0) {
            for (let index = 0; index < idOfNotis.length; index++) {
                // check noti ton tai
                let notification = await prisma.notification.findUnique({ where: { id: idOfNotis[index] } })

                if (!notification) {
                    return res.status(404).json({ ok: false, message: "Có thông báo không tồn tại!" })
                }
                if (loginAccount.id !== notification.to) {
                    return res.status(404).json({ ok: false, message: "Có thông báo không phải của bạn!" })
                }
            }

            idOfNotis.forEach(async element => {
                await prisma.notification.update({
                    where: { id: element },
                    data: { isRead: true }
                });
                // update firestore
                async function updateDocument(db) {
                    const FieldValue = admin.firestore.FieldValue;
                    const aNotiRef = db.collection('notifications').doc(`${element}`);
                    const res = await aNotiRef.update({ isRead: true, createAt: FieldValue.serverTimestamp() }, )
                        .then(function() {
                            console.log("Document update with ID: ", aNotiRef.id);
                            notiFirestore++;
                        })
                        .catch(function(error) {
                            console.error("Error adding document: ", error);
                        });
                }
                await updateDocument(db);
            });
            return res.json({ ok: true, message: "Cập nhật thông báo thành công!" })

        }
        // neu khong truyen body (ids legth = 0) thì set read all
        await prisma.notification.updateMany({
                where: { to: loginAccount.id },
                data: { isRead: true }
            })
            // các thông báo của login account
        const notisOfAccount = await prisma.notification.findMany({ where: { to: loginAccount.id } });
        notisOfAccount.forEach(async element => {
            // update firestore
            async function updateAllDocument(db) {
                const FieldValue = admin.firestore.FieldValue;
                const aNotiRef = db.collection('notifications').doc(`${element.id}`);
                const res = await aNotiRef.update({ isRead: true, createAt: FieldValue.serverTimestamp() })
                    .then(function() {
                        console.log("Document update with ID: ", aNotiRef.id);
                        notiFirestore++;
                    })
                    .catch(function(error) {
                        console.error("Error adding document: ", error);
                    });;
            }
            await updateAllDocument(db);
        });
        // console.log(notiFirestore)
        // if (notiFirestore === 0) {
        //     return res.status(400).json({ ok: false, message: "Có lỗi khi cập nhật thông báo!" })
        // }

        return res.json({ ok: true, message: "Cập nhật thông báo thành công!" })
    } catch (error) {
        console.log(error);
        return res.status(404).json({ ok: false, message: "Something went wrong" })
    } finally {
        async() =>
        await prisma.$disconnect()
    }
}