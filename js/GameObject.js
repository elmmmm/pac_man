//游戏对象基类
class GameObject{
    constructor(){
        this.has_called_start = false; //是否执行过start函数
        this.timedelta = 0; //当前帧距离上一帧的时间间隔
        this.frames = 1;
        this.times = 0;
        this.timeout = 0;
        this._COS = [1,0,-1,0];
	    this._SIN = [0,1,0,-1];
        
    }

    get(i, j){ //i:行, j:列
        if(this.mapData[i] && typeof this.mapData[i][j] != "undefined"){
            return this.mapData[i][j];
        }
        return -1; //超出地图的索引返回-1
    }

    set(i, j, value){
        if(this.mapData[i]){
            this.mapData[i][j] = value;
        }
    }

    coord2position(ci, cj){ //当前索引转换画布坐标（取的是方块中心）
        return { //会把起点的数值加上
            x: this.x + cj*this.size + this.size/2,
            y: this.y + ci*this.size + this.size/2
        };
    }

    position2coord(x, y){
        var fx = Math.abs(x-this.x)%this.size - this.size/2;
        var fy = Math.abs(y-this.y)%this.size - this.size/2;
        
        return {
            i: Math.floor((y-this.y) / this.size),
            j: Math.floor((x-this.x) / this.size),
           offset: Math.sqrt(fx*fx + fy*fy) //偏离方块中心的距离 offset要么为0，要么为正数
        };
    }

    start(){  //只在第一帧执行一次

    }

    update(){ //每一帧都会执行，用于更新物体画面的参数数据

    }
 
    on_destroy(){ //销毁前执行一次

    }

    destroy(){ //删掉该物体
        this.on_destroy();
        // for(let i = 0; i < GAME_OBJECTS.length; i++){
        //     if(GAME_OBJECTS[i] == this){
        //         GAME_OBJECTS.splice(i, 1); //从全局数组中删除
        //         break;
        //     }
        // }
    }
}


export {GameObject}