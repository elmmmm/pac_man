import { GamePlayground } from "./js/GamePlayground.js";

class Game {
    constructor(id) {
        this.id = id;
        this.canvas = document.getElementById(id);
        this.level = 0; //游戏第一关，总共预留了3关的地图
        this.life = 5;
        this.score = 0;

        this.playground = new GamePlayground(this.canvas, this.level);
    }

    gameReset() {

    }

    addListeningEvents() {
        var nextBtn = document.getElementById("nextBtn");
        var lastBtn = document.getElementById("lastBtn");
        var resetBtn = document.getElementById("resetBtn");
        var deadBtn = document.getElementById("deadButton");
        var deadPannel = document.getElementById("deadDialog");
        var passBtn = document.getElementById("passButton");
        var passPannel = document.getElementById("passDialog");

        //重置按钮
        resetBtn.addEventListener("click", () => {
            this.playground = null
            this.playground = new GamePlayground(this.canvas, this.level);
            this.playground.start();
            console.log("reset", this)
        })
        //下一关按钮
        nextBtn.addEventListener("click", function () {
            if (this.level != 2) {
                this.level = this.level + 1 > 2 ? 2 : this.level + 1;
                if (this.level == 2) {
                    nextBtn.disabled = true;
                } else if (this.level == 0 + 1) {
                    lastBtn.disabled = false;
                }
                this.playground = null
                this.playground = new GamePlayground(this.canvas, this.level);
                this.playground.start();
                console.log("nextBtn", this)
            }
            var text = `第 ${this.level + 1} 关`; //模板字符串 
            document.querySelector("#stage-amount-label").innerHTML = text;

        }.bind(this))
        //上一关按钮
        lastBtn.addEventListener("click", function () {
            if (this.level != 0) {
                this.level = this.level - 1 < 0 ? 0 : this.level - 1;
                if (this.level == 2 - 1) {
                    nextBtn.disabled = false;
                } else if (this.level == 0) {
                    lastBtn.disabled = true;
                }
                this.playground = null
                this.playground = new GamePlayground(this.canvas, this.level);
                this.playground.start();
                console.log("lastBtn", this)
            }
            var text = `第 ${this.level + 1} 关`;
            document.querySelector("#stage-amount-label").innerHTML = text;
        }.bind(this))

        //游戏失败模态框
        deadBtn.addEventListener("click", function () {
            deadPannel.classList.add("hide");
        })

        //通关模态框
        passBtn.addEventListener("click", function () {
            passPannel.classList.add("hide");
            nextBtn.click();
        })
    }

    start() {
        this.playground.start();
        document.getElementById("lastBtn").disabled = true;
        this.addListeningEvents();

        //刷帧，不断递归渲染游戏画面到画布
        let last_timestamp;
        var that = this;  //这个this是game对象
        var f = 0; //canvas完成帧数统计


        //canvas循环刷帧函数!!!
        var GAME_ANIMATION = function (timestamp) {
            var ctx = that.playground.canvas.getContext("2d");
            ctx.clearRect(0, 0, that.playground.width, that.playground.height); //清除画布
            ctx.fillStyle = "rgba(0,0,0,0.9)"; //重新填充一个黑色背景，那不清除画布也行吧
            ctx.fillRect(0, 0, that.playground.width, that.playground.height);

            f++; //闭包

            //遍历墙和豆子对象刷新渲染（绘制）-maps
            for (let i = 0; i < that.playground.maps.length; i++) {
                let obj = that.playground.maps[i];
                if (!(f % obj.frames)) { //求余为0，说明又经过了frames帧
                    obj.times = f / obj.frames; //计数器
                }
                if (!obj.has_called_start) { //首次渲染
                    obj.start();
                    obj.has_called_start = true;
                } else {
                    obj.timedelta = last_timestamp - timestamp;
                    if (obj.timeout) {
                        obj.timeout--;
                    }
                    obj.update();
                }
                obj.render() //绘制
            }
            //遍历幽灵-ghosts
            that.playground.ghosts.forEach(function (obj) {
                if (!(f % obj.frames)) { //求余为0，说明又经过了frames帧
                    obj.times = f / obj.frames; //计数器
                }
                if (!obj.has_called_start) { //首次渲染
                    obj.start();
                    obj.has_called_start = true;
                } else {
                    obj.timedelta = last_timestamp - timestamp;
                    // if(playground.status == 1 && obj.status != 2){ //处于正常状态才更新位移，如果玩家死亡中，或处于游戏暂停时，幽灵参数保持不变
                    if (that.playground.status == 1 && that.playground.player.status != 3 && that.playground.total != that.playground.player.score) {
                        obj.update();
                        if (obj.timeout) {  //逃跑状态倒计时
                            obj.timeout--;
                        }
                    }
                }
                obj.render() //绘制
            })

            //遍历其他游戏对象（目前只有玩家对象）刷新渲染（绘制）
            that.playground.items.forEach(function (obj) {
                if (!(f % obj.frames)) { //求余为0，说明又经过了frames帧
                    obj.times = f / obj.frames; //计数器
                }
                if (!obj.has_called_start) { //首次渲染
                    obj.start();
                    obj.has_called_start = true;
                } else {
                    obj.timedelta = last_timestamp - timestamp;
                    if (that.playground.status == 1 && that.playground.player.status != 3) { //场景处于正常进行状态（非暂停）并且玩家没死才更新
                        obj.update();
                    } else if (that.playground.player.status == 3) {  //玩家死了要倒计时，目前暂时没有别的需要倒计时的对象
                        if (obj.timeout && that.playground.status == 1) { //目前只有玩家死亡状态有倒计时需求
                            obj.timeout--;
                            if (obj.timeout == 0) {
                                that.playground.player.life--;
                                if (that.playground.player.life) { //玩家还有生命
                                    document.querySelector("#life-amount-label").innerHTML = (that.playground.player.life - 1) + " / 4"
                                    //重置幽灵和玩家！！！
                                    that.playground.player.status = 1; //玩家恢复正常状态，保留分数、生命数据
                                    //让幽灵从老家出发
                                    for (var i = 0; i < 4; i++) {
                                        var ghost = that.playground.ghosts[i];
                                        ghost.status = 1;
                                        ghost.coord = { j: 12 + i, i: 14 };
                                        ghost.vector = { j: 12 + i, i: 14 };
                                        var homePos = ghost.location.coord2position(ghost.homeCoord.i, ghost.homeCoord.j);
                                        ghost.x = homePos.x;
                                        ghost.y = homePos.y;
                                        ghost.timeout = 60*i + Math.floor(Math.random() * 30);
                                    }
                                } else {
                                    //显示游戏失败模态框
                                    document.getElementById("deadDialog").classList.remove("hide");
                                }
                            }
                        }
                    }
                }
                obj.render(); //绘制
            })

            var text = that.playground.player.score + " / " + that.playground.total
            document.querySelector("#coin-amount-label").innerHTML = text;
            text = "+ " + that.playground.player.buffCount + " * 60" //吃幽灵加60分
            document.querySelector("#buff-amount-label").innerHTML = text;
            //进入下一关
            if (that.playground.total == that.playground.player.score) {
                if(that.level == 2){
                    document.getElementById("pass-label").innerHTML = "恭喜你完成全部挑战~<br>你真棒🎉~";
                }
                document.getElementById("passDialog").classList.remove("hide");
            }

            last_timestamp = timestamp;
            requestAnimationFrame(GAME_ANIMATION);
        }
        requestAnimationFrame(GAME_ANIMATION); //在这里就开始不停刷帧
    }
}

window.onload = function () {
    var game;
    game = new Game("canvas");
    game.start(); //进入第一关
}