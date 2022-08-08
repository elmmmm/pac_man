import { GameObject } from "./GameObject.js";
//四个幽灵类
export class Ghost extends GameObject {
    constructor(playground, index, color) {
        super();
        this.playground = playground;
        this.player = this.playground.player;
        this.location = this.playground.map;
        this.mapData = this.location.mapData;
        this.id = index;
        this.path = [];
        this.homeCoord = { j: 12 + index, i: 14 };
        this.coord = { j: 12 + index, i: 14 };
        this.vector = { j: 12 + index, i: 14 };
        var startPos = this.location.coord2position(this.coord.i, this.coord.j);
        this.x = startPos.x; //当前这个幽灵中心点的位置
        this.y = startPos.y;
        this.size = 18;  //方格的大小
        this.ghostSize = 24;
        this.orientation = 3; //方向，眼睛朝向
        this.color = color;
        this.frames = 10;
        this.speed = 1; //移动速度
        this.timeout = 60*index + Math.floor(Math.random() * 30); //让四个幽灵先后离开家
        this.times = 0; //刷新画布计数
        this.randomCoord = null;
        this.status = 1;	 //对象状态,0表示未激活/结束,1表示正常,2表示暂停,3表示逃跑状态,4表示幽灵死亡回城
        this.ctx = this.playground.canvas.getContext("2d");
    }

    is_collision() {
        var dx = this.x - this.player.x;
        var dy = this.y - this.player.y;
        if (dx * dx + dy * dy < Math.pow((this.ghostSize / 2 + this.player.playerSize / 2), 2) - 10) {
            return true;
        }
        return false;
    }

    update() {
        var new_map;
        if (this.status == 3 && !this.timeout) {
            this.status = 1;
        }
        if (!this.coord.offset) { //到达方格中心，offset为0；第一次为 !undefined
            if (this.status == 1) {  //正常状态，幽灵追踪玩家
                if (!this.timeout) { //如果幽灵正常状态下有倒计时，则等待计时结束后再追踪玩家
                    new_map = JSON.parse(JSON.stringify(this.mapData).replace(/2/g, 0)); //把幽灵的家替换成可走路径（墙为1，豆子为0）
                    var id = this.id;
                    this.playground.ghosts.forEach(function (item) {
                        if (item.id != id && item.status == 1) { //幽灵将其他的处于正常状态的幽灵视为一堵墙
                            new_map[item.coord.i][item.coord.j] = 1;
                        }
                    });
                    this.path = this.location.finder(new_map, this.coord, this.player.coord, 'path');  //幽灵寻找玩家位置，返回路径数组
                    if (this.path.length) {  //如果返回的路径不是空数组，如果是空数组，继续使用上一个vector
                        this.vector = this.path[0];  //获取要前往的下一个位置
                    }
                }
            } else if (this.status == 3) { //幽灵逃跑状态
                new_map = JSON.parse(JSON.stringify(this.mapData).replace(/2/g, 0)); //把幽灵的家替换成可走路径（墙为1，豆子为0）
                var id = this.id;
                this.playground.ghosts.forEach(function (item) {
                    if (item.id != id) { //幽灵将其他的处于正常状态的幽灵视为一堵墙
                        new_map[item.coord.i][item.coord.j] = 1;
                    }
                });

                // this.path = this.location.finder(new_map, this.player.coord, this.coord, 'next');
                // //幽灵逃跑时要远离玩家，finder返回不与玩家路径相通的上下左右四个位置，从中随机选一个作为下一个位置
                // if (this.path.length) {  //如果返回的路径不是空数组，如果是空数组，继续使用上一个vector
                //     this.vector = this.path[Math.floor(Math.random() * this.path.length)];  //获取要前往的下一个位置
                // }

                //改为前往一个随机位置，过几帧改一次
                if(this.times % 2 || this.randomCoord == null){
                    // console.log(!this.times % 4)
                    this.randomCoord = {i: Math.floor(Math.random()*new_map.length), j: Math.floor(Math.random()*new_map[0].length)};
                    while(new_map[this.randomCoord.i][this.randomCoord.j]){ //直至随机到一个不是墙的点
                        this.randomCoord = {i: Math.floor(Math.random()*new_map.length), j: Math.floor(Math.random()*new_map[0].length)};
                    }
                }
                
                this.path = this.location.finder(new_map, this.coord, this.randomCoord, 'path');
                if (this.path.length) {  //如果返回的路径不是空数组，如果是空数组，继续使用上一个vector
                    this.vector = this.path[0];  //获取要前往的下一个位置
                }
            } else if (this.status == 4) { //幽灵被吃变成眼睛回家的状态，可以无视其他幽灵阻碍
                new_map = JSON.parse(JSON.stringify(this.mapData).replace(/2/g, 0));
                this.path = this.location.finder(new_map, this.coord, this.homeCoord, "path");
                if (this.path.length) {
                    this.vector = this.path[0];  //获取要前往的下一个位置
                } else { //恢复正常状态，从家里重新出发
                    this.status = 1;
                }
            }

            if (this.vector.change) {  //change为1应该进入贯通的路径-从另一边出来
                this.coord.i = this.vector.i;
                this.coord.j = this.vector.j;
                var pos = this.location.coord2position(this.coord.i, this.coord.j);
                this.x = pos.x;
                this.y = pos.y;
            }
            //方向判定
            if (this.vector.j > this.coord.j) {
                this.orientation = 0;  //往右
            } else if (this.vector.j < this.coord.j) {
                this.orientation = 2;  //往左
            } else if (this.vector.i > this.coord.i) {
                this.orientation = 1;  //往下 
            } else if (this.vector.i < this.coord.i) {
                this.orientation = 3;  //往上
            }

        }
        // if (this.vector.i != this.coord.i || this.vector.j != this.coord.j) {
            //更新位置
            this.x += this.speed * this._COS[this.orientation];
            this.y += this.speed * this._SIN[this.orientation];
        // }

        // 更新当前位置所在地图中索引
        if (this.location) {
            this.coord = this.location.position2coord(this.x, this.y); //这会计算一个offset
        }

        //碰撞检测
        if (this.is_collision() && this.status != 4) {//幽灵碰到玩家，更改状态（非幽灵死亡时-status为4）
            if (this.status != 3) { //幽灵不是逃跑状态下碰撞，玩家死亡
                this.player.status = 3;  //3表示玩家死亡中（临时）：玩家逐渐消失
                this.player.timeout = 40;
            } else { //幽灵逃跑状态下碰撞，则幽灵死亡
                this.status = 4;
                this.player.buffCount++;  //获得增益
            }
        }
    }

    render() {
        var isSick = false;
        if (this.status == 3) {//逃跑状态
            isSick = this.timeout > 80 || this.times % 2 ? true : false; //如果||左侧表达式为 true，则直接短路返回结果，不再运算右侧表达式。
        }
        if (this.status != 4) { //吃了大力丸后被玩家碰到后幽灵是没有身体的，只有眼睛
            this.ctx.fillStyle = isSick ? "#BABABA" : this.color;  // #BABABA-灰色
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.ghostSize * 0.5, 0, Math.PI, true); //true为逆时针
            switch (this.times % 2) {
                case 0:  //三只脚
                    this.ctx.lineTo(this.x - this.ghostSize * 0.5, this.y + this.ghostSize * 0.4);
                    //二次贝塞尔曲线 quadraticCurveTo(控制点，结束点)
                    this.ctx.quadraticCurveTo(this.x - this.ghostSize * .4, this.y + this.ghostSize * 0.5, this.x - this.ghostSize * 0.2, this.y + this.ghostSize * 0.3);
                    this.ctx.quadraticCurveTo(this.x, this.y + this.ghostSize * 0.5, this.x + this.ghostSize * 0.2, this.y + this.ghostSize * 0.3);
                    this.ctx.quadraticCurveTo(this.x + this.ghostSize * .4, this.y + this.ghostSize * 0.5, this.x + this.ghostSize * 0.5, this.y + this.ghostSize * 0.4);
                    break;
                case 1:  //两只脚
                    this.ctx.lineTo(this.x - this.ghostSize * 0.5, this.y + this.ghostSize * 0.3);
                    this.ctx.quadraticCurveTo(this.x - this.ghostSize * 0.25, this.y + this.ghostSize * 0.5, this.x, this.y + this.ghostSize * 0.3);
                    this.ctx.quadraticCurveTo(this.x + this.ghostSize * 0.25, this.y + this.ghostSize * 0.5, this.x + this.ghostSize * 0.5, this.y + this.ghostSize * 0.3);
                    break;
            }
            this.ctx.fill();
            this.ctx.closePath();
        }
        //画眼睛和眼球
        this.ctx.fillStyle = "#FFF" //白色眼底
        if (isSick) {  //逃跑时幽灵没有眼球
            this.ctx.beginPath();
            this.ctx.arc(this.x - this.ghostSize * 0.15, this.y - this.ghostSize * 0.21, this.ghostSize * 0.10, 0, 2 * Math.PI, false); //左眼
            this.ctx.arc(this.x + this.ghostSize * 0.15, this.y - this.ghostSize * 0.21, this.ghostSize * 0.10, 0, 2 * Math.PI); //右眼
            this.ctx.fill();
            this.ctx.closePath();
        } else { //正常情况幽灵有两个黑色眼球
            this.ctx.beginPath();
            this.ctx.arc(this.x - this.ghostSize * 0.15, this.y - this.ghostSize * 0.21, this.ghostSize * 0.15, 0, 2 * Math.PI, false); //左眼
            this.ctx.arc(this.x + this.ghostSize * 0.15, this.y - this.ghostSize * 0.21, this.ghostSize * 0.15, 0, 2 * Math.PI); //右眼
            this.ctx.fill();
            this.ctx.closePath();
            this.ctx.fillStyle = "#000"; //黑色眼球
            this.ctx.beginPath();
            this.ctx.arc(this.x - this.ghostSize * (0.15 - 0.04 * this._COS[this.orientation]), this.y - this.ghostSize * (0.21 - 0.04 * this._SIN[this.orientation]), this.ghostSize * 0.08, 0, 2 * Math.PI);
            this.ctx.arc(this.x + this.ghostSize * (0.15 + 0.04 * this._COS[this.orientation]), this.y - this.ghostSize * (0.21 - 0.04 * this._SIN[this.orientation]), this.ghostSize * 0.08, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.closePath();
        }

    }
}