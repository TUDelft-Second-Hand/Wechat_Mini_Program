const db = wx.cloud.database();
const app = getApp();
const config = require("../../config.js");
Page({
      data: {
            systeminfo: app.systeminfo,
            entime: {
                  enter: 600,
                  leave: 300
            }, //进入褪出动画时长
            college: JSON.parse(config.data).college.splice(1),
            steps: [
                  {
                        text: '步骤一',
                        desc: '输入物品信息'
                  },
                  {
                        text: '步骤二',
                        desc: '发布成功'
                  },
            ],
            fileList : [
            ],
            fileId : ""
      },
      //恢复初始态
      initial() {
            let that = this;
            that.setData({
                  dura: 30,
                  price: 15,
                  place: '',
                  chooseDelivery: 0,
                  cids: '-1', //学院选择的默认值
                  isbn: '',
                  show_a: true,
                  show_b: false,


                  active: 0,
                  chooseCollege: false,
                  note_counts: 0,
                  notes: '',
                  kindid: 0,
                  kind: [{
                        name: '通用',
                        id: 0,
                        check: true,
                  }, {
                        name: '分类',
                        id: 1,
                        check: false
                  }],
                  delivery: [{
                        name: '自提',
                        id: 0,
                        check: true,
                  }, {
                        name: '帮送',
                        id: 1,
                        check: false
                  }],

            })
      },
      onLoad() {
            this.initial();
      },
      //价格输入改变
      priceChange(e) {
            this.data.price = e.detail;
      },
      //时才输入改变
      duraChange(e) {
            this.data.dura = e.detail;
      },
      //地址输入
      placeInput(e) {
            console.log(e)
            this.data.place = e.detail.value
      },
      //书籍类别选择
      kindChange(e) {
            let that = this;
            let kind = that.data.kind;
            let id = e.detail.value;
            for (let i = 0; i < kind.length; i++) {
                  kind[i].check = false
            }
            kind[id].check = true;
            if (id == 1) {
                  that.setData({
                        kind: kind,
                        chooseCollege: true,
                        kindid: id
                  })
            } else {
                  that.setData({
                        kind: kind,
                        cids: '-1',
                        chooseCollege: false,
                        kindid: id
                  })
            }
      },
      //选择专业
      choCollege(e) {
            let that = this;
            that.setData({
                  cids: e.detail.value
            })
      },
      //取货方式改变
      delChange(e) {
            let that = this;
            let delivery = that.data.delivery;
            let id = e.detail.value;
            for (let i = 0; i < delivery.length; i++) {
                  delivery[i].check = false
            }
            delivery[id].check = true;
            if (id == 1) {
                  that.setData({
                        delivery: delivery,
                        chooseDelivery: 1
                  })
            } else {
                  that.setData({
                        delivery: delivery,
                        chooseDelivery: 0
                  })
            }
      },
      //输入备注
      noteInput(e) {
            let that = this;
            that.setData({
                  note_counts: e.detail.cursor,
                  notes: e.detail.value,
            })
      },
      afterRead(event) {
            const { file } = event.detail;
            // 当设置 mutiple 为 true 时, file 为数组格式，否则为对象格式
            let tempData = {
                  url: file.url,
                  isImage: true,
                  deletable: true
            }
            const { fileList = [] } = this.data;
            fileList.push(tempData)
            this.setData({fileList})
      },

      delete(event) {
            const { fileList = [] } = this.data
            fileList.pop()
            this.setData({fileList})
      },
      //发布校检
      check_pub() {
            let that = this;
            if (!app.openid) {
                  wx.showModal({
                        title: '温馨提示',
                        content: '该功能需要注册方可使用，是否马上去注册',
                        success(res) {
                              if (res.confirm) {
                                    wx.navigateTo({
                                          url: '/pages/login/login',
                                    })
                              }
                        }
                  })
                  return false
            }
            //如果用户选择了专业类书籍，需要选择学院
            if (that.data.kind[1].check) {
                  if (that.data.cids == -1) {
                        wx.showToast({
                              title: '请选择学院',
                              icon: 'none',
                        });
                        return false;
                  }
            }
            //如果用户选择了自提，需要填入详细地址
            if (that.data.delivery[0].check) {
                  if (that.data.place == '') {
                        wx.showToast({
                              title: '请输入地址',
                              icon: 'none',
                        });
                        return false;
                  }
            }

            if (that.data.name =="") {
                  wx.showToast({
                    title: "请输入名称",
                    icon: 'none'
                  });
                  return false;
            };
            const { fileList } = this.data;
            if (!fileList.length) {
                  wx.showToast({
                    title: '请添加图片',
                    icon: 'none'
                  })
            };

            that.publish();
      },
      //正式发布
      publish() {
            let that = this;
            wx.showModal({
                  title: '温馨提示',
                  content: '经检测您填写的信息无误，是否马上发布？',
                  success(res) {
                        if (res.confirm) {
                              wx.cloud.init();
                              const { fileList } = this.data;
                              let url = fileList[0].url;
                              let suffix = /\.[^\.]+$/.exec(url)[0]
                              wx.cloud.uploadFile({
                                    cloudPath: "storage/" + new Date().getTime() + suffix,
                                    filePath: url, 
                                    success: res => {
                                          this.setData({fileId:res.fileID})
                                          publishData();
                                    },
                                    fail: err => {
                                          wx.showToast({
                                                title: '上传失败，请检查网络设置',
                                                icon: 'none',
                                          });
                                          return false;
                                    }
                              })
                        }
                  }
            })
      },
      publishData(){
            db.collection('publish').add({
                  data: {
                        creat: new Date().getTime(),
                        dura: new Date().getTime() + that.data.dura * (24 * 60 * 60 * 1000),
                        status: 0, //0在售；1买家已付款，但卖家未发货；2买家确认收获，交易完成；3、交易作废，退还买家钱款
                        price: that.data.price, //售价
                        //分类
                        kindid: that.data.kindid, //区别通用还是专业
                        collegeid: that.data.cids, //学院id，-1表示通用类
                        deliveryid: that.data.chooseDelivery, //0自1配
                        place: that.data.place, //选择自提时地址
                        notes: that.data.notes, //备注
                        bookinfo: {
                              _id: that.data.bookinfo._id,
                              author: that.data.bookinfo.author,
                              edition: that.data.bookinfo.edition,
                              pic: that.data.bookinfo.pic,
                              price: that.data.bookinfo.price,
                              title: that.data.bookinfo.title,
                        },
                        key: that.data.bookinfo.title + that.data.bookinfo.keyword
                  },
                  success(e) {
                        console.log(e)
                        that.setData({
                              show_a: false,
                              show_b: true,
                              active: 2,
                              detail_id: e._id
                        });
                        //滚动到顶部
                        wx.pageScrollTo({
                              scrollTop: 0,
                        })
                  }
            })
      },
      detail() {
            let that = this;
            wx.navigateTo({
                  url: '/pages/detail/detail?scene=' + that.data.detail_id,
            })
      }
})