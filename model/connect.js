const mongoose = require('mongoose');

//连接数据库
mongoose.connect('mongodb://localhost/MyAccounter', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('数据库连接成功..'))
    .catch(err => console.log(err, '数据库连接失败'))