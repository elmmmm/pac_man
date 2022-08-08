import { GameObject } from "./GameObject.js"
//地图上墙的类
export class GameMap extends GameObject {
    constructor(playground) {
        super();
        this.x = 3;  //绘制地图的原点
        this.y = 3;
        this.size = 18; //方块的大小
        this.playground = playground;
        this.mapData = this.playground.data.map;
        this.i_length = this.mapData.length; //行数
        this.j_length = this.mapData[0].length; //列数
        this.wall_color = this.playground.data.wall_color;
        this.cache = false; //地图的墙只在第一次通过数据绘制，之后都把图形保存到 imageData中
        this.imageDate = null;
        this.ctx = this.playground.canvas.getContext("2d");
    }

    finder(new_map, startCoord, endCoord,type) {  //幽灵搜索路径算法
        var options = {
            map: new_map,
            start: startCoord,
            end: endCoord,
            type: type
        }
        if (options.map[options.start.i][options.start.j] || options.map[options.end.i][options.end.j]) {
            //如果起点或终点是墙的话
            return [];
        }
        var finded = false;
        var result = [];
        var y_length = options.map.length;
        var x_length = options.map[0].length;
        var steps = Array(y_length).fill(0).map(() => Array(x_length).fill(0));  //步骤的映射，每个方格位置初始化为0
        var _getValue = function (i, j) {
            if (options.map[i] && typeof options.map[i][j] != "undefined") {
                return options.map[i][j];
            }
            return -1;
        }
        var _next = function (to) { //判断是否可以走，可走就放进列表
            var value = _getValue(to.i, to.j)
            if (value < 1) {
                if (value == -1) {
                    to.i = (to.i + y_length) % y_length;
                    to.j = (to.j + x_length) % x_length;
                    to.change = 1;
                }
                //地图中value为0表示豆子，1表示墙，value即小于1，又不为-1，那就是0了
                if(!steps[to.i][to.j]){ 
                    result.push(to);
                }
            }
        }
        var _render = function(list){ //找线路
            var new_list = [];
            var next = function(from, to){
                var value = _getValue(to.i, to.j);
                if(value < 1){ //判断当前点是否可走
                    if(value == -1){
                        to.i = (to.i + y_length)%y_length;
                        to.j = (to.j + x_length)%x_length;
                        to.change = 1;
                    }
                    if(to.i == options.end.i && to.j == options.end.j){ //找到终点
                        steps[to.i][to.j] = from;
                        finded = true;
                    }else if(!steps[to.i][to.j]){ //steps中to的位置为0，即这个位置没有被遍历过就添加进new_list
                        steps[to.i][to.j] = from;
                        new_list.push(to);  //new_list用于下一层递归搜索
                    }
                }
            }
            list.forEach(function(current){
                next(current, {i: current.i + 1, j: current.j});
                next(current, {i: current.i, j: current.j + 1});
                next(current, {i: current.i - 1, j: current.j});
                next(current, {i: current.i, j: current.j - 1});
            })
            if(!finded && new_list.length){ //还没找到终点，继续递归搜索
                _render(new_list);
            }
        }
        _render([options.start]);  //从起点开始搜索
        if(finded){ //找到了终点，从steps中从终点追溯出路径
            var current = options.end;
            if(options.type == "path"){
                while(current.i != options.start.i || current.j != options.start.j){ //所以含参start和end是同一个位置返回空数组
                    result.unshift(current);
                    current = steps[current.i][current.j];
                }
            }else if(options.type == "next"){
                _next({i: current.i + 1, j: current.j});
                _next({i: current.i, j: current.j + 1});
                _next({i: current.i - 1, j: current.j});
                _next({i: current.i, j: current.j - 1});
            }
        }
        return result; //路径不通，也是返回一个空数组
    }

    start() {
    }

    update() {
        
    }

    render() {  //在画布里绘制图形
        var _COS = [1, 0, -1, 0];
        var _SIN = [0, 1, 0, -1];
        this.ctx.lineWidth = 2;

        for (var i = 0; i < this.i_length; i++) {
            for (var j = 0; j < this.j_length; j++) {
                var value = this.get(i, j);
                if (value) { //如果值为1、2、-1
                    var code = [0, 0, 0, 0];
                    if (this.get(i, j + 1) && !(this.get(i - 1, j + 1) && this.get(i + 1, j + 1) && this.get(i - 1, j) && this.get(i + 1, j))) {
                        code[0] = 1;
                    }
                    if (this.get(i + 1, j) && !(this.get(i + 1, j - 1) && this.get(i + 1, j + 1) && this.get(i, j - 1) && this.get(i, j + 1))) {
                        code[1] = 1;
                    }
                    if (this.get(i, j - 1) && !(this.get(i - 1, j - 1) && this.get(i + 1, j - 1) && this.get(i - 1, j) && this.get(i + 1, j))) {
                        code[2] = 1;
                    }
                    if (this.get(i - 1, j) && !(this.get(i - 1, j - 1) && this.get(i - 1, j + 1) && this.get(i, j - 1) && this.get(i, j + 1))) {
                        code[3] = 1;
                    }

                    if (code.indexOf(1) > -1) { // code数组里面有1
                        this.ctx.strokeStyle = value == 2 ? "#FFF" : this.wall_color; //当前值为2使用白色，为1使用墙的颜色
                        var pos = this.coord2position(i, j);  //索引转换画布坐标（取的是方块中心）
                        switch (code.join('')) {
                            //code中1是要画圆角的情形
                            case '1100':
                                this.ctx.beginPath();
                                this.ctx.arc(pos.x + this.size / 2, pos.y + this.size / 2, this.size / 2, Math.PI, 1.5 * Math.PI, false);
                                this.ctx.stroke();
                                this.ctx.closePath();
                                break;
                            case '0110':
                                this.ctx.beginPath();
                                this.ctx.arc(pos.x - this.size / 2, pos.y + this.size / 2, this.size / 2, 1.5 * Math.PI, 2 * Math.PI, false);
                                this.ctx.stroke();
                                this.ctx.closePath();
                                break;
                            case '0011':
                                this.ctx.beginPath();
                                this.ctx.arc(pos.x - this.size / 2, pos.y - this.size / 2, this.size / 2, 0, .5 * Math.PI, false);
                                this.ctx.stroke();
                                this.ctx.closePath();
                                break;
                            case '1001':
                                this.ctx.beginPath();
                                this.ctx.arc(pos.x + this.size / 2, pos.y - this.size / 2, this.size / 2, .5 * Math.PI, 1 * Math.PI, false);
                                this.ctx.stroke();
                                this.ctx.closePath();
                                break;
                            default:
                                var dist = this.size / 2;
                                code.forEach(function (v, index) {
                                    if (v) { //画直线
                                        // console.log(this);
                                        this.ctx.beginPath();
                                        this.ctx.moveTo(pos.x, pos.y);
                                        this.ctx.lineTo(pos.x - _COS[index] * dist, pos.y - _SIN[index] * dist);
                                        this.ctx.stroke();
                                        this.ctx.closePath();
                                    }
                                }, this);
                        }
                    }
                }

            }
        }

    }

}

