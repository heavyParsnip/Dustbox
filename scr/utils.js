/*** Utility functions & pre-computed variables ***/

///PRE-CALCULATED VALUES///

//Pi values
const PI_DOUBLE = Math.PI * 2;
const PI_HALF = Math.PI / 2;
const PI_QUARTER = Math.PI / 4;

///UTILITY FUNCTIONS///

//Distance calculation
export function distance(x1, x2, y1, y2)
{
    const distX = x2-x1;
    const distY = y2-y1;
    return Math.sqrt(distX * distX + distY * distY);
}

export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function drawRectangle(ctx,x,y,width,height,fillStyle="black",lineWidth=0,strokeStyle="black")
{
    ctx.save();
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.rect(x,y,width,height);
    ctx.fill();
    if (lineWidth > 0)
    {
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = strokeStyle;
        ctx.stroke();
    }
    ctx.closePath();
    ctx.restore();
}

export function drawArc(ctx,x,y,radius,fillStyle="black",lineWidth=0,strokeStyle="black",startAngle=0,endAngle=Math.PI*2)
{
    ctx.save();
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.arc(x,y,radius,startAngle,endAngle);
    ctx.fill();
    if (lineWidth > 0)
    {
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = strokeStyle;
        ctx.stroke();
    }
    ctx.closePath();
    ctx.restore();
}

export function drawLine(ctx,x1,y1,x2,y2,lineWidth=1,strokeStyle="black")
{
    ctx.save();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
}

export {PI_DOUBLE, PI_HALF, PI_QUARTER};