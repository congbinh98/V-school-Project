const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');
require('dotenv').config();

const instance = axios.create({
    baseURL: process.env.thanhatURL

});

// const THANG = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

// save parents
module.exports.saveDataPhuhuynh = async(request, response) => {
    try {
        // danh sach sdt trong DB
        const phonesDB = [];
        var phoneFromDB = await prisma.parent.findMany({ select: { phone: true } });
        for (let index = 0; index < phoneFromDB.length; index++) {
            const element = phoneFromDB[index];
            phonesDB.push(element.phone);
        }
        const msts = await prisma.school.findMany({ select: { MST: true } });
        // danh sach dien thoai phu huynh tren thanhhat
        var phones = [];
        // lay data tu thanhat va add sdt vao phones
        for (let index = 0; index < msts.length; index++) {
            // chạy từng mst
            const element = msts[index];
            const res = await instance.post('/api/banks/nhan1truong', {
                    MST: element.MST
                }, global.options)
                .catch(function(error) {
                    console.log("Lấy dữ liệu thanhat thất bại!")
                    console.log(error.response.data)
                })
                // data cac invoice cua thanhnhat theo MST (element[index])
            const invoices = res.data.data;
            if (invoices.length === 0) {
                continue;
            }
            invoices.forEach(element => {
                // neu TEL1 hoac TEL2 ko null
                if (element.TEL1 !== "") {
                    phones.push(element.TEL1);
                }
                if (element.TEL2 !== "") {
                    phones.push(element.TEL2);
                }
            });
        }
        // xóa các số trùng trên thanhat
        var phoneSet = new Set(phones);
        phones = Array.from(phoneSet);
        // xóa các số đã có trong DB
        phones = phones.filter(val => !phonesDB.includes(val));
        // bắt đầu lưu vào DB
        if (phones.length === 0) {
            return response.json({ ok: false, message: "Không có số điện thoại mới nào!" })
        } else {
            var saveData = null;
            var i = 0;
            while (i < phones.length) {
                saveData = await prisma.account.create({
                    data: {
                        id: phones[i],
                        name: 'New parent',
                        email: phones[i] + '@gmail.com',
                        password: process.env.COMMONPASSWORD,
                        status: 'ACTIVE',
                        accRole: 'PARENT',
                        parent: {
                            create: {
                                phone: phones[i]
                            }
                        }
                    },

                });
                i++;
            }
            if (!saveData) {
                return response.status(404).json({ ok: false, message: "Lưu data thất bại!" })
            }
            return response.json({ ok: true, message: "Lưu data thành công!" })
        }
    } catch (error) {
        return response.status(404).json({ ok: false, message: "Something went wrong" })
    } finally {
        async() =>
        await prisma.$disconnect()
    }
}

// save invoices
module.exports.saveDataInvoices = async(request, response) => {
  try {
      const msts = await prisma.school.findMany({ select: { MST: true } });
      // danh sach invoidID trong DB
      var invoicesDB = [];
      var invoiceFromDB = await prisma.invoice_mapping.findMany({ select: { invoiceId: true, bhyt: true } });
      for (let index = 0; index < invoiceFromDB.length; index++) {
          const element = invoiceFromDB[index];
          invoicesDB.push(element);
      }

      // danh sách các invoidID từ thanhNhat
      var invoicesTN = [];
      for (let index = 0; index < msts.length; index++) {
          // chạy từng mst
          const element = msts[index];
          const res = await instance.post('/api/banks/nhan1truong', {
                  MST: element.MST
              }, global.options)
              .catch(function(error) {
                  console.log("Lấy dữ liệu thanhat thất bại!")
                  console.log(error.response.data)
              })
              // data invoice cua thanhnhat theo MST tháng hiện tại
          const invoicesFromTN = res.data.data;
          if (invoicesFromTN.length === 0) {
              continue;
          } else {
              invoicesFromTN.forEach(element => {
                  var invoice = {
                      invoiceId: element.INVOIDID,
                      bhyt: element.MABHYT
                  }
                  invoicesTN.push(invoice)
              });
          }
      }
      // lúc này invoicesTN sẽ có tất cả các invoice trên thanhat
      // xóa các invoice mà invoiceID đã có trong DB
      const setInvoicesId = new Set(invoicesDB.map(x => x.invoiceId));
      invoicesTN = invoicesTN.filter(val => !setInvoicesId.has(val.invoiceId));
      //bắt đầu lưu vào DB
      if (invoicesTN.length === 0) {
          return response.json({ ok: false, message: "Không có hóa đơn mới nào!" })
      } else {
          var saveData = null;
          var i = 0;
          while (i < invoicesTN.length) {
              saveData = await prisma.invoice_mapping.create({
                  data: {
                      invoiceId: invoicesTN[i].invoiceId,
                      bhyt: invoicesTN[i].bhyt
                  },

              })
              i++
          }
          if (!saveData) {
              return response.status(404).json({ ok: false, message: "Lưu data thất bại!" })
          }
          return response.json({ ok: true, message: "Lưu data thành công!" })
      }

  } catch (error) {
      return response.status(404).json({ ok: false, message: "Something went wrong" })
  } finally {
      async() =>
      await prisma.$disconnect()
  }
}

// save data student
module.exports.saveDataStudents = async(request, response) => {
  const mst = request.body.MST;
  if (!mst || mst === "") {
      return response.status(400).json({ ok: false, message: "Thêm MST" });
  }
  try {
      const students = await prisma.student.findMany({ select: { BHYT: true } });
      // bhyt có trong DB
      const bhyts = students.map(x => x.BHYT);
      // lấy dl từ thanhat
      const res = await instance.post('/api/banks/nhan1truong', {
              MST: mst
          }, global.options)
          .catch(function(error) {
              console.log("Lấy dữ liệu thanhat thất bại!")
              console.log(error.response.data)
          });
      const invoices = res.data.data;
      if (invoices.length === 0) {
          return response.status(400).json({ ok: false, message: "Không có hóa đơn nào trong tháng này!" });
      }
      var bhytsTN = [];
      invoices.forEach(element => {
          var student = {
              BHYT: element.MABHYT,
              phoneParent: element.TEL1,
              MST: element.MST,
              classcode: element.MALOP,
              name: element.HOTEN
          }
          bhytsTN.push(student)
      });
      // lucs này bhytsTN có tất cả các hoc sinh trên thanhat tháng này
      // xóa các bhyt trùng trên thanhat
      var bhytSet = new Set(bhytsTN);
      bhytsTN = Array.from(bhytSet);

      // xóa các số đã có trong DB
      bhytsTN = bhytsTN.filter(val => !bhyts.includes(val.BHYT));
      if (bhytsTN.length === 0) {
          return response.status(400).json({ ok: false, message: "Không có học sinh mới trong tháng!" });
      }

      // list các học sinh add lỗi
      var studentError = [];
      for (let index = 0; index < bhytsTN.length; index++) {
          const element = bhytsTN[index];
          var schoolOfStudent = await prisma.school.findUnique({ where: { MST: element.MST } });
          var parentOfStudent = await prisma.parent.findUnique({ where: { phone: element.phoneParent } });
          if (!parentOfStudent) {
              return response.status(400).json({ ok: false, message: "Phụ huynh của học sinh chưa tồn tại! Liên hệ admin" });
          }
          var saveData = await prisma.student.create({
              data: {
                  BHYT: element.BHYT,
                  name: element.name,
                  classcode: element.classcode,
                  schoolId: schoolOfStudent.id,
                  parentId: parentOfStudent.id
              }
          });
          if (!saveData) {
              studentError.push(element)
          }
      }
      if (studentError.length !== 0) {
          return response.json({ ok: true, message: "Lưu các học sinh " + studentError + " thất bại!\n Xin kiểm tra lại các học sinh này!" });
      } else {
          return response.json({ ok: true, message: "Lưu tất cả học sinh thành công" });
      }
  } catch (error) {
      return response.status(404).json({ ok: false, message: "Something went wrong" });
  } finally {
      async() =>
      await prisma.$disconnect()
  }
}
