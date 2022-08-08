import { GameObject } from "./GameObject.js";
//玩家类
class Player extends GameObject {
    constructor(playground) {
        super();
        this.playground = playground;
        this.ctx = this.playground.canvas.getContext("2d");
        this.beans = this.playground.beans;  //获取豆子
        this.ghosts = this.playground.ghosts;  //获取幽灵用来检测碰撞
        this.location = this.playground.map; //获取墙
        this.mapData = this.playground.data.map;
        this.coord = { i: 23, j: 13 }; //通过地图索引来确定玩家位置 i-行，对应y，j-列，对应x； 起始没有offset
        var startPos = this.location.coord2position(this.coord.i, this.coord.j);
        this.x = startPos.x; //当前玩家中心点的位置
        this.y = startPos.y;

        this.size = 18;  //方格的大小
        this.playerSize = 22; //玩家大小
        this.orientation = 2; //小黄球的移动方向、嘴巴朝向
        this.speed = 2;  //玩家要比幽灵速度快一点
        this.control = {}; //用于控制玩家方向
        this.score = 0;
        this.buffCount = 0;
        this.life = 5;
        this.status = 1; //1表示正常，2表示暂停，3表示死亡中，4表示buff增益中
        this.timeout = 0; //消失倒计时
        this.frames = 10;  //帧计数速度，用于控制times多久变化一次
        this.times = 0; //帧计数，会不断加一-用于切换对象的不同形态
    }

    start() {

    }

    update() {
        var coord = this.coord;
        // console.log("offset",coord.offset);
        if (!coord.offset) {  //来到方格中心，检测下一步方向；offset为距离方块中心点的偏移量，起始为 !undefined为true
            if (typeof this.control.orientation != "undefined") { //方向发生改变
                if (!this.get(coord.i + this._SIN[this.control.orientation], coord.j + this._COS[this.control.orientation])) {//值为0表示有豆子
                    this.orientation = this.control.orientation; //设置新的方向
                    console.log("orientation", this.orientation)
                }
            }
            this.control = {}; //？
            var value = this.get(coord.i + this._SIN[this.orientation], coord.j + this._COS[this.orientation]);
            if (value == 0) { //墙地图为0表示下一步可以移动，如果下一个位置为墙就不会更新x、y
                this.x += this.speed * this._COS[this.orientation];
                this.y += this.speed * this._SIN[this.orientation];
            } else if (value < 0) {  //如果超出边界（返回值-1），指地图中间贯穿的特殊通道，定位到另一边
                this.x -= this.size * (this.mapData[0].length - 1) * this._COS[this.orientation];
                this.y -= this.size * (this.mapData.length - 1) * this._SIN[this.orientation];
            }
        } else { //进入下一个方格，有豆子吃豆子
            var value = this.beans.get(this.coord.i, this.coord.j);
            if (!value) { //豆子地图为0，可以吃掉
                this.score++; //分数加一
                this.beans.set(this.coord.i, this.coord.j, 1); //吃掉的豆子位置设置为1
                //如果吃到大力丸
                if (this.beans.buffPos[this.coord.j + ',' + this.coord.i]) {
                    this.ghosts.forEach(function (item) {
                        if (item.status == 1 || item.status == 3) { //吃到大力丸，把幽灵切换为逃跑状态
                            item.status = 3;
                            item.timeout = 800;
                        }
                    })
                }
            }
            this.x += this.speed * this._COS[this.orientation];
            this.y += this.speed * this._SIN[this.orientation];
        }

        // 更新当前位置所在地图中索引
        if (this.location) {
            this.coord = this.location.position2coord(this.x, this.y); //这会计算一个offset
        }

    }

    render() { //玩家是一个小黄球
        this.ctx.fillStyle = "#FFE600";
        this.ctx.beginPath();
        if (this.status != 3) { //正常状态下或暂停状态，非死亡中状态
            // if(this.status == 2 && this.timeout != 0){
            //     this.ctx.arc(this.x, this.y, this.playerSize/2, (0.5*this.orientation + 1-0.02*this.timeout)*Math.PI, (0.5*this.orientation-(1-0.02*this.timeout))*Math.PI)
            // }else{
            if (this.times % 2) { //切换张嘴闭嘴的形态
                this.ctx.arc(this.x, this.y, this.playerSize / 2, (.5 * this.orientation + .20) * Math.PI, (.5 * this.orientation - .20) * Math.PI, false)
            } else {
                this.ctx.arc(this.x, this.y, this.playerSize / 2, (.5 * this.orientation + 0.01) * Math.PI, (.5 * this.orientation - .01) * Math.PI)
            }
        } else { //状态为3，玩家被吃
            if (this.timeout) { //timeout不为0，进行黄豆扇形面积不断缩小的动画
                this.ctx.arc(this.x, this.y, this.playerSize / 2, (0.5 * this.orientation + 1 - 0.02 * this.timeout) * Math.PI, (0.5 * this.orientation - (1 - 0.02 * this.timeout)) * Math.PI)
            }
        }
        this.ctx.lineTo(this.x, this.y);  //画线回到中心点
        this.ctx.closePath();
        this.ctx.fill();
    }
}

export { Player }