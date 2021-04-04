//Express框架
const express = require('express');
//连接数据库
require('./model/connect');
//获取数据库集合
const {User, Account, Deal} = require('./model/collection');

//实例化express应用
const app = express();

//静态资源
app.use(express.static('assets'));
// for parsing application/json
app.use(express.json());
// for parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true })); 

//设置访问网站API 允许 跨域访问
app.use((req, res, next) => {
    res.append('Access-Control-Allow-Origin', '*');
    res.append('Access-Control-Allow-Content-Type', '*');
    next();
})

//建议
function getAdvice(deal, accountNumber) {
    if(deal.dealType!='收'&&accountNumber<=0) return '账户的钱都花完啦~';
    switch (deal.dealType) {
        case '收':
            switch (deal.dealNumber>=1000?1:(deal.dealNumber>=100?2:3)) {
                case 1: 
                    return '需不需要试试个人理财呀~\n可以使用 微信-零钱通 或 支付宝-余额宝 赚收益啦~';
                case 2: 
                    return '快把一笔笔收入积攒起来吧~';
                case 3:
                    return '一笔小收入进账啦~';
            };
        case '食': 
            switch (deal.dealNumber>=200?1:(deal.dealNumber>=100?2:3)) {
                case 1: 
                    return '这是去大吃大喝一顿了吗?';
                case 2: 
                    return '胃口好，吃啥啥香~';
                case 3:
                    return '要吃好喝好哦~';
            };
        case '购':
            switch (deal.dealNumber>=1000?1:(deal.dealNumber>=200?2:3)) {
                case 1: 
                    return '买了什么呀这么贵？';
                case 2: 
                    return '买买买~';
                case 3:
                    return '勤俭持家哦~';
            };
        case '行':
            switch (deal.dealNumber>=500?1:(deal.dealNumber>=50?2:3)) {
                case 1: 
                    return '出了趟远门呀？照顾好自己~';
                case 2: 
                    return '该花就花~';
                case 3:
                    return '绿色出行哦~';
            };
    }
}

//用户登录/注册
app.post('/login', async (req, res) => {
    console.log('用户登录/注册..')
    let user = await User.findOne({nickName: req.body.nickName});
    //未找到该用户
    if(user==null) {
        await User.create({
            nickName: req.body.nickName,
            password: req.body.password
        }).then(result=>user = result);
        //创建默认账户
        await Account.create({
            accountType: '现金',
            accountName: '现金',
            userId: user._id
        },{
            accountType: '支付宝',
            accountName: '支付宝',
            userId: user._id
        },{
            accountType: '微信',
            accountName: '微信',
            userId: user._id
        },{
            accountType: '银行卡',
            accountName: '银行卡',
            accountCard: '未选择发卡行',
            userId: user._id
        });
        let accounts = await Account.find({userId: user._id});
        let result={
            user: user,
            accounts: accounts,
            deals: [],
            note: '注册用户'+user.nickName+'成功!'
        };
        console.warn(result.note);
        res.send(result);
    //找到该用户
    } else {
        //判断密码是否正确
        if(user.password==req.body.password) {
            let accounts = await Account.find({userId: user._id});
            let deals = await Deal.find({userId: user._id});
            let result={
                user: user,
                accounts: accounts,
                deals: deals
            };
            console.warn('用户登录成功:', user.nickName);
            res.send(result);
        } else {
            let result={
                user: '',
                accounts: [],
                deals: []
            };
            console.warn('密码错误！')
            res.send(result);
        }
    }
})

//修改用户信息
app.post('/modifyUser', async (req, res) => {
    console.log('修改用户信息..', req.body);
    await User.updateOne({_id: req.body.id}, req.body.user);
    console.log('修改用户信息成功！');
    res.sendStatus(200);
})

//修改用户密码
app.post('/modifyPassword', async (req, res) => {
    console.log('修改用户密码..', req.body);
    await User.updateOne({_id: req.body.userId}, req.body.user);
    console.log('修改用户密码成功！');
    res.sendStatus(200);
})

//修改accounterName
app.post('/changeAccounterName', async (req, res) => {
    console.log('修改accounterName..', req.body);
    await User.updateOne({_id: req.body.userId}, {accounterName: req.body.accounterName});
    await User.findOne({_id: req.body.userId}).then(result=>res.send(result));
    console.log('修改accounterName成功！');
})

//新增账户信息
app.post('/addAccount', async (req, res) => {
    console.log('新增账户信息..', req.body);
    await Account.create({
        accountType: req.body.accountType,
        accountName: req.body.accountName,
        accountNumber: req.body.accountNumber,
        accountCard: req.body.accountCard,
        userId: req.body.userId
    }).then(result=>res.send(result));
    console.log('新增账户信息成功！');
})

//修改账户信息
app.post('/modifyAccount', async (req, res) => {
    console.log('修改账户信息..', req.body);
    await Account.updateOne({_id: req.body.id}, req.body.account);
    console.log('修改账户信息成功！');
    res.sendStatus(200);
})

//删除账户信息
app.post('/deleteAccount', async (req, res) => {
    console.log('删除账户信息..', req.body);
    await Account.deleteOne({_id: req.body.id});
    await Deal.deleteMany({outAccountId: req.body.id});
    await Deal.deleteMany({inAccountId: req.body.id});
    console.log('删除账户及相关记录成功！');
    res.sendStatus(200);
})

//新增账户转账
app.post('/transferAccount', async (req, res) => {
    console.log('新增账户转账..', req.body);
    let outAccount = await Account.findOne({_id: req.body.outAccountId});
    let inAccount = await Account.findOne({_id: req.body.inAccountId});
    outAccount.accountNumber=(parseFloat(outAccount.accountNumber) - parseFloat(req.body.transferNumber)).toFixed(2);
    inAccount.accountNumber=(parseFloat(inAccount.accountNumber) + parseFloat(req.body.transferNumber)).toFixed(2);
    await Account.updateOne({_id: req.body.outAccountId}, outAccount);
    await Account.updateOne({_id: req.body.inAccountId}, inAccount);
    await Deal.create({
            dealType: '转',
            dealName: '转账',
            dealNumber: req.body.transferNumber,
            dealTime: req.body.transferTime,
            dealNote: req.body.transferNote,
            outAccountId: req.body.outAccountId,
            inAccountId: req.body.inAccountId,
            userId: req.body.userId
        });
    let accounts = await Account.find({userId: req.body.userId});
    let deals = await Deal.find({userId: req.body.userId});
    let result={
        accounts: accounts,
        deals: deals
    };
    console.log('新增账户转账成功！');
    res.send(result);
})

//新增deal
app.post('/addDeal', async (req, res) => {
    console.log('新增deal..', req.body);
    let outAccount = await Account.findOne({_id: req.body.outAccountId});
    if(req.body.dealType=='收'){
        outAccount.accountNumber=(parseFloat(outAccount.accountNumber) + parseFloat(req.body.dealNumber)).toFixed(2);
    } else {
        outAccount.accountNumber=(parseFloat(outAccount.accountNumber) - parseFloat(req.body.dealNumber)).toFixed(2);
    }
    await Account.updateOne({_id: req.body.outAccountId}, outAccount);
    let advice = getAdvice(req.body, outAccount.accountNumber);
    await Deal.create({
            dealType: req.body.dealType,
            dealName: req.body.dealName,
            dealNumber: req.body.dealNumber,
            dealTime: req.body.dealTime,
            dealNote: req.body.dealNote,
            dealAdvice: advice,
            outAccountId: req.body.outAccountId,
            userId: req.body.userId
        });
    let accounts = await Account.find({userId: req.body.userId});
    let deals = await Deal.find({userId: req.body.userId});
    let result={
        accounts: accounts,
        deals: deals
    };
    console.log('新增deal成功！');
    res.send(result);
})

//删除deal
app.post('/deleteDeal', async (req, res) => {
    console.log('删除deal..', req.body);
    let outAccount = await Account.findOne({_id: req.body.deal.outAccountId});
    if(req.body.deal.dealType=='收') {
        await Deal.findOneAndDelete({_id: req.body.deal._id});
        outAccount.accountNumber=(parseFloat(outAccount.accountNumber) - parseFloat(req.body.deal.dealNumber)).toFixed(2);
        await Account.updateOne({_id: req.body.deal.outAccountId}, outAccount);
    } else if (req.body.deal.dealType=='转') {
        await Deal.findOneAndDelete({_id: req.body.deal._id});
        let inAccount = await Account.findOne({_id: req.body.deal.inAccountId});
        outAccount.accountNumber=(parseFloat(outAccount.accountNumber) + parseFloat(req.body.deal.dealNumber)).toFixed(2);
        inAccount.accountNumber=(parseFloat(inAccount.accountNumber) - parseFloat(req.body.deal.dealNumber)).toFixed(2);
        await Account.updateOne({_id: req.body.deal.outAccountId}, outAccount);
        await Account.updateOne({_id: req.body.deal.inAccountId}, inAccount);
    } else {
        await Deal.findOneAndDelete({_id: req.body.deal._id});
        outAccount.accountNumber=(parseFloat(outAccount.accountNumber) + parseFloat(req.body.deal.dealNumber)).toFixed(2);
        await Account.updateOne({_id: req.body.deal.outAccountId}, outAccount);
    }
    let accounts = await Account.find({userId: req.body.deal.userId});
    let deals = await Deal.find({userId: req.body.deal.userId});
    let result={
        accounts: accounts,
        deals: deals
    };
    console.log('删除deal成功！');
    res.send(result);
})

//修改deal
app.post('/modifyDeal', async (req, res) => {
    console.log('修改deal..', req.body);
    let oldDeal = await Deal.findOne({_id: req.body.deal._id});
    let outAccount = await Account.findOne({_id: req.body.deal.outAccountId});
    if(req.body.deal.dealType=='收') {
        if(oldDeal.outAccountId!=req.body.deal.outAccountId) {
            let oldOutAccount = await Account.findOne({_id: oldDeal.outAccountId});
            outAccount.accountNumber=(parseFloat(outAccount.accountNumber) + parseFloat(req.body.deal.dealNumber)).toFixed(2);
            oldOutAccount.accountNumber=(parseFloat(oldOutAccount.accountNumber) - parseFloat(oldDeal.dealNumber)).toFixed(2);
            await Account.updateOne({_id: oldDeal.outAccountId}, oldOutAccount);
            await Account.updateOne({_id: req.body.deal.outAccountId}, outAccount);
        } else {
            outAccount.accountNumber=(parseFloat(outAccount.accountNumber) - parseFloat(oldDeal.dealNumber) + parseFloat(req.body.deal.dealNumber)).toFixed(2);
            await Account.updateOne({_id: req.body.deal.outAccountId}, outAccount);
        }
    } else if (req.body.deal.dealType=='转') {
        //撤回之前转账
        let oldInAccount = await Account.findOne({_id: oldDeal.inAccountId});
        let oldOutAccount = await Account.findOne({_id: oldDeal.outAccountId});
        oldInAccount.accountNumber=(parseFloat(oldInAccount.accountNumber) - parseFloat(oldDeal.dealNumber)).toFixed(2);
        oldOutAccount.accountNumber=(parseFloat(oldOutAccount.accountNumber) + parseFloat(oldDeal.dealNumber)).toFixed(2);
        await Account.updateOne({_id: oldDeal.inAccountId}, oldInAccount);
        await Account.updateOne({_id: oldDeal.outAccountId}, oldOutAccount);
        //更新现在转帐
        let outAccount = await Account.findOne({_id: req.body.deal.outAccountId});
        let inAccount = await Account.findOne({_id: req.body.deal.inAccountId});
        outAccount.accountNumber=(parseFloat(outAccount.accountNumber) - parseFloat(req.body.deal.dealNumber)).toFixed(2);
        inAccount.accountNumber=(parseFloat(inAccount.accountNumber) + parseFloat(req.body.deal.dealNumber)).toFixed(2);
        await Account.updateOne({_id: req.body.deal.outAccountId}, outAccount);
        await Account.updateOne({_id: req.body.deal.inAccountId}, inAccount);
    } else {
        if(oldDeal.outAccountId!=req.body.deal.outAccountId) {
            let oldOutAccount = await Account.findOne({_id: oldDeal.outAccountId});
            outAccount.accountNumber=(parseFloat(outAccount.accountNumber) - parseFloat(req.body.deal.dealNumber)).toFixed(2);
            oldOutAccount.accountNumber=(parseFloat(oldOutAccount.accountNumber) + parseFloat(oldDeal.dealNumber)).toFixed(2);
            await Account.updateOne({_id: oldDeal.outAccountId}, oldOutAccount);
            await Account.updateOne({_id: req.body.deal.outAccountId}, outAccount);
        } else {
            outAccount.accountNumber=(parseFloat(outAccount.accountNumber) + parseFloat(oldDeal.dealNumber) - parseFloat(req.body.deal.dealNumber)).toFixed(2);
            await Account.updateOne({_id: req.body.deal.outAccountId}, outAccount);
        }
    }
    await Deal.updateOne({_id: req.body.deal._id}, req.body.deal);
    let accounts = await Account.find({userId: req.body.deal.userId});
    let deals = await Deal.find({userId: req.body.deal.userId});
    let result={
        accounts: accounts,
        deals: deals
    };
    console.log('修改deal成功！');
    res.send(result);
})

app.listen(3000, () => {
    console.log('服务器启动成功..');
})