import {GameObject} from "./GameObject.js"
//路径上的豆子类
export class Beans extends GameObject{
    constructor(playground){
        super();
        this.x = 3;  //绘制地图的原点
        this.y = 3;
        this.size = 18; //方块的大小
        this.playground = playground;
        this.mapData = JSON.parse(JSON.stringify(this.playground.data.map)); //数组深拷贝
        this.i_length = this.mapData.length; //行数
        this.j_length = this.mapData[0].length; //列数
        this.buffPos = this.playground.data.goods;
        this.ctx = this.playground.canvas.getContext("2d");
        this.frames = 8;
    }

    start(){
    }

    total(){
        var num = 0;
        for(var i=0; i < this.mapData.length; i++){
            for(var j=0; j < this.mapData[i].length; j++){
                if(this.mapData[i][j] == 0){
                    num++;
                }
            }
        }
        return num;
    }

    update(){
        
    }

    render(){
        for(var i=0; i < this.i_length; i++){
            for(var j=0; j < this.j_length; j++){
                if(!this.get(i, j)){ //地图中的0代表豆子
                    var pos = this.coord2position(i, j);
                    this.ctx.fillStyle = "#F5F5DC";
                    if(this.buffPos[j+','+i] == 1){  //大力丸的位置
                        this.ctx.fillStyle = "#00FF00"; //绿色
                        this.ctx.beginPath();
                        if(this.times%2){ //呼吸灯大力丸
                            this.ctx.arc(pos.x, pos.y, 3, 0, 2*Math.PI);
                        }else{
                            this.ctx.arc(pos.x, pos.y, 3 + 1, 0, 2*Math.PI);
                        }
                        this.ctx.fill();
                        this.ctx.closePath();
                    }else{
                        this.ctx.fillRect(pos.x-2, pos.y-2, 4, 4);
                    }
                }
            }
        }
    }
}