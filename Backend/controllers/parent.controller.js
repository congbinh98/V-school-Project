const { PrismaClient } = require('@prisma/client');
const { func } = require('joi');
const prisma = new PrismaClient();

function existId(array, id) {
  const found = array.some(element => element.id === id);
  return found;
}


// create data access
async function getAll() {
  try {
    return await prisma.parent.findMany({ include: { account: true } });
  } catch (error) {
    console.log(error);
    return null;
  } finally {
    async () => {
      await prisma.$disconnect;
    }
  }
}


async function getOne(id) {
  try {
    return await prisma.parent.findUnique({ where: { id }, include: { account: true } });
  } catch (error) {
    console.log(error);
    return null;
  } finally {
    async () => {
      await prisma.$disconnect;
    }
  }
}

async function updateAccount(id, data) {
  try {
    var parent = getOne(id);
    var accountId = (await parent).account.id;
    var account = await prisma.account.update({
      where: { id: accountId },
      data
    })
    return account;
  } catch (error) {
    console.log(error);
    return null;
  } finally {
    async () => {
      await prisma.$disconnect;
    }

  }
}

async function update(id, data) {
  try {
    var parent = getOne(id);
    return await prisma.parent.update({ where: { id }, data });
  } catch (error) {
    console.log(error);
    return null;
  } finally {
    async () => {
      await prisma.$disconnect;
    }

  }
}

async function checkParamId(req, res) {
  var id = parseInt(req.params.id);
  if (!existId(await getAll(), id)) {
    res.status(400).json({ ok:false, error: `không tồn tại tài khoản với id ${id}` });
    return null;
  }
  return id;
}

// create controllers 

module.exports.getAll = async function(req,res){
  var result = await (await getAll()).sort((parent1,parent2)=>{
    return parent2.account.createDate - parent1.account.createDates;
  })
  res.json({ok:true,data:result,message:"Lấy danh sách người dùng thành công"});
}

module.exports.getOne = async function (req, res) {
  var id = await checkParamId(req, res);
  if (id !== null) {
    var parent = await getOne(id);
    res.json({ok:true,data:parent,message:"Lấy thông tin người dùng thành công"});
  }
}

module.exports.updateAccount = async function (req, res) {
  var id = await checkParamId(req, res);
  if (id !== null) {
    var data = req.body;
    var account = await updateAccount(id, data);
    if (!account) {
      return res.status(400).send({ ok:false, error:"Thông tin nhập sai" });
    }
    res.json({ok:true,data:account,message:"Thay đổi mật khẩu thành công"});
  }
}
module.exports.ban = async function (req, res) {
  var id = await checkParamId(req, res);
  if (id !== null) {
    var data = { status: 'ban' };
    var account = await updateAccount(id, data);
    return res.json({ok:true,data:account,message:"khóa tài khoản thành công"});
  }
}
module.exports.unban = async function (req, res) {
  var id = await checkParamId(req, res);
  if (id !== null) {
    var data = { status: 'unban' };
    var account = await updateAccount(id, data);
    return res.json({ok:true,data:account,message:"Mở khóa tài khoản thành công"});
  }
}

module.exports.updateParent = async function (req, res) {
  var id = await checkParamId(req, res);
  if (id !== null) {
    try {
      var data = req.body;
      var parent = await update(id, data);
      if (!parent) {
        return res.status(400).send({ ok:false, error:"Thông tin nhập sai" });
      }
      res.json({ok:true,data:parent,message:"Cập nhật người dùng thành công"});
    } catch (error) {
      return res.status(400).send({ ok:false, error:"Cập nhật thất bại"  });
    }
  }
}



