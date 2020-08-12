/* 

USER MANUAL

This script generate diecut for paper bags. 
It's draw halfsize and fullsize diecuts automatically, 
with check machines limits and throw error, if max size have exceeded.

Usage: 
1) Open Adobe Illustrator and call dialog for create new artwork (Ctrl+N). 

2) Select artwork name field and pass parameters. 
    Required parameters: width, height and depth (necessarily in this order!);

    Optional parameters: custom glue, handle and/or bottom margins (order and availability is not important);

    Flags: '--forcefull' and '--forcehalf' — forced generation of the cut of the desired design. Be careful with forced generation!

    Notation: {WIDTH}x{HEIGHT}x{DEPTH}_g{GlueMargin}-h{HandleMargin}-b{BottomMargin}-bleed{BleedOffset}[{--forcefull}||{--forcehalf}]
        Any separator characters can be used between parameters, except digits.
    
    Samples: 250+350+100                      <-- for default glue margin = 20mm, handle margin = 40mm, bottom margin = 25mm, bleed offset = 3mm
             300-190-180_h60                  <-- only one custom parameter
             235x450x120+g15-h50              <-- two custom parameters
             170*250*150-b30_h55_g15_bleed5   <-- all custom parameters
             400/190/130_bleed0h25b10g17      <-- no separators between custom parameters is also possible (^~^)
             800_750_650--forcefull           <-- draw fullsize diecut anyway    

3) Check drawing

4) Enjoy!

*/ // Andy Z | Accent Printhouse | 2020



// Helpers //
function mm2pt(mm) {return mm / 25.4 * 72};
function pt2mm(pt) {return pt * 25.4 / 72};


    // !!!!!!!!!!!!!!!!!!!!! //
    // *** CONFIGURATION *** //
    var KNIFE_MAX_SIZE = {
        width: mm2pt(710),
        height: mm2pt(506)
    };
    // !!!!!!!!!!!!!!!!!!!!! //


// Okey, Let's Rock! //

var docRef = activeDocument;

docRef.spots.removeAll();
docRef.swatches.removeAll();


// Add 'ProofColor' Spot //

var proofName = 'ProofColor';

var proofAltColor = new CMYKColor();
proofAltColor.cyan = 100;
proofAltColor.magenta = 0;
proofAltColor.yellow = 100;
proofAltColor.black = 0;

var proof = docRef.spots.add();
proof.colorType = ColorModel.SPOT;
proof.color = proofAltColor;
proof.name = proofName;

var proofColor = new SpotColor();
proofColor.tint = 100;
proofColor.spot = proof;


// Add 'Big' Spot //

var spotName = 'Big';

var spotAltColor = new CMYKColor();
spotAltColor.cyan = 90;
spotAltColor.magenta = 0;
spotAltColor.yellow = 80;
spotAltColor.black = 0;

var spot = docRef.spots.add();
spot.colorType = ColorModel.SPOT;
spot.color = spotAltColor;
spot.name = spotName;

var spotColor = new SpotColor();
spotColor.tint = 100;
spotColor.spot = spot;


// Preparation //

docRef.defalutStroked = true;
docRef.defaultStrokeColor = spotColor;
docRef.defaultStrokeOverprint = true; 


// Sizes //

var nameRX = /(\d{2,4})\D(\d{2,4})\D(\d{2,4})\D?(.+)?/;

var parsedName = nameRX.exec(docRef.name);

var params = {
  glue: parsedName[4] ? /g(\d{2,3})/.exec(parsedName[4]) : undefined,
  handle: parsedName[4] ? /h(\d{2,3})/.exec(parsedName[4]) : undefined,
  bottom: parsedName[4] ? /b(\d{2,3})/.exec(parsedName[4]) : undefined,

  bleed: parsedName[4] ? /bleed(\d{1,2})/.exec(parsedName[4]) : undefined,

  forceFull: parsedName[4] ? /forcefull/.exec(parsedName[4]) : undefined,
  forceHalf: parsedName[4] ? /forcehalf/.exec(parsedName[4]) : undefined
};

var BAG_SIZES = {
    width: mm2pt( parsedName[1] ),
    height: mm2pt( parsedName[2] ),
    depth: mm2pt( parsedName[3] ),

    glueMargin: mm2pt( params.glue ? params.glue[1] : 20 ),
    handleMargin: mm2pt( params.handle ? params.handle[1] : 40 ),
    bottomMargin: mm2pt( params.bottom ? params.bottom[1] : 25 )    
};

if ( BAG_SIZES.bottomMargin > BAG_SIZES.depth/2 ) {
    BAG_SIZES.bottomMargin = BAG_SIZES.depth/2 - mm2pt(5);
};

var bleed = mm2pt( params.bleed ? params.bleed[1] : 3 );

var force = params.forceFull ? params.forceFull[0] : (params.forceHalf ? params.forceHalf[0] : false);


function drawLine(lineStart, lineEnd) {
    var newLine = docRef.pathItems.add();
    newLine.setEntirePath(
        [ [lineStart[0], lineStart[1]], 
        [lineEnd[0], lineEnd[1]] ]);
};


function drawText (text, coords, rotation) {
    var textRef = docRef.textFrames.add();
    if (rotation) {
        textRef.rotate(rotation);
    }
    textRef.contents = text;

    textRef.top = coords[1];
    textRef.left = coords[0];    

    textRef.textRange.characterAttributes.size = 26;
    textRef.textRange.characterAttributes.overprintFill = true;
    textRef.textRange.characterAttributes.fillColor = proofColor;       
};


var Ph = {
    a: BAG_SIZES.glueMargin,
    b: BAG_SIZES.glueMargin + BAG_SIZES.width,
    c: BAG_SIZES.glueMargin + BAG_SIZES.width + BAG_SIZES.depth / 2,
    d: BAG_SIZES.glueMargin + BAG_SIZES.width + BAG_SIZES.depth,
    e: BAG_SIZES.glueMargin + BAG_SIZES.width * 2 + BAG_SIZES.depth,
    f: BAG_SIZES.glueMargin + BAG_SIZES.width * 2 + BAG_SIZES.depth * 1.5,
    h: BAG_SIZES.glueMargin + BAG_SIZES.width * 2 + BAG_SIZES.depth * 2
}

var Pv = {
    a: BAG_SIZES.depth / 2 + BAG_SIZES.bottomMargin,
    b: BAG_SIZES.depth + BAG_SIZES.bottomMargin, ///// 1-sided big!
    c: BAG_SIZES.height + BAG_SIZES.depth / 2 + BAG_SIZES.bottomMargin,
    d: BAG_SIZES.height + BAG_SIZES.depth / 2 + BAG_SIZES.bottomMargin + BAG_SIZES.handleMargin
}

var bH = BAG_SIZES.handleMargin + BAG_SIZES.height + BAG_SIZES.depth / 2 + BAG_SIZES.bottomMargin;
var bW = BAG_SIZES.glueMargin + BAG_SIZES.width * 2 + BAG_SIZES.depth * 2;



function drawHalfDiecut(){ // *** Draw half diecut ***

    bH = BAG_SIZES.handleMargin + BAG_SIZES.height + BAG_SIZES.depth / 2 + BAG_SIZES.bottomMargin;
    bW = BAG_SIZES.glueMargin + BAG_SIZES.width + BAG_SIZES.depth;

    //----- Vertical lines
    /*frame*/ // drawLine( [0, 0], [0, bH] );
    drawLine( [Ph.a, -bleed], [Ph.a, (bH + bleed)] );
    drawLine( [Ph.b, -bleed], [Ph.b, (bH + bleed)] );
    drawLine( [Ph.c, -bleed], [Ph.c, (bH + bleed)] );
    /*frame*/ // drawLine( [Ph.d, -bleed], [Ph.d, (bH + bleed)] );

    //----- Horisontal lines
    /*frame*/ // drawLine( [0, 0], [bW, 0] );
    drawLine( [-bleed, Pv.a], [(bW + bleed), Pv.a] );
    drawLine( [-bleed, Pv.c], [(bW + bleed), Pv.c] );
    /*frame*/ // drawLine( [0, Pv.d], [bW, Pv.d] );
    drawLine( [-bleed, Pv.b], [Ph.c, Pv.b] ); ///// 1-sided big!

    //----- Diagonal lines
    drawLine( [Ph.c, Pv.b], [(Ph.d + bleed), (Pv.a-bleed)] );
    drawLine( [Ph.c, Pv.b], [(Ph.c - Pv.b - bleed), -bleed] );
    drawLine( [(Ph.a + Pv.a + bleed), -bleed], [-bleed, (Pv.a + BAG_SIZES.glueMargin + bleed)] );

    //----- Horisontal sizes
    drawText( pt2mm(BAG_SIZES.glueMargin) , [BAG_SIZES.glueMargin/2 - 13, (bH - 10)] );
    drawText( pt2mm(BAG_SIZES.width) , [(Ph.a+Ph.b)/2 - 13, (bH - 10)] );
    drawText( pt2mm(BAG_SIZES.depth/2) , [(Ph.b+Ph.c)/2 - 13, (bH - 10)] );
    drawText( pt2mm(BAG_SIZES.depth/2) , [(Ph.c+Ph.d)/2 - 13, (bH - 10)] );

    //----- Vertical sizes
    drawText( pt2mm(BAG_SIZES.depth/2+BAG_SIZES.bottomMargin) , [10, Pv.a/2] , 90);
    drawText( pt2mm(BAG_SIZES.height) , [10, (Pv.a+Pv.c)/2] , 90);
    drawText( pt2mm(BAG_SIZES.handleMargin) , [10, (Pv.c+Pv.d)/2] , 90);
};


function drawFullDiecut(){ // *** Draw full diecut ***

    //----- Vertical lines
    /*frame*/ // drawLine( [0, 0], [0, bH] );
    drawLine( [Ph.a, -bleed], [Ph.a, (bH + bleed)] );
    drawLine( [Ph.b, -bleed], [Ph.b, (bH + bleed)] );
    drawLine( [Ph.c, -bleed], [Ph.c, (bH + bleed)] );
    drawLine( [Ph.d, -bleed], [Ph.d, (bH + bleed)] );
    drawLine( [Ph.e, -bleed], [Ph.e, (bH + bleed)] );
    drawLine( [Ph.f, -bleed], [Ph.f, (bH + bleed)] );
    /*frame*/ // drawLine( [Ph.h, 0], [Ph.h, bH] );

    //----- Horisontal lines
    /*frame*/ // drawLine( [0, 0], [bW, 0] );
    drawLine( [-bleed, Pv.a], [(bW + bleed), Pv.a] );
    drawLine( [-bleed, Pv.c], [(bW + bleed), Pv.c] );
    /*frame*/ // drawLine( [0, Pv.d], [bW, Pv.d] );
    drawLine( [Ph.c, Pv.b], [Ph.f, Pv.b] ); ///// 1-sided big!

    //----- Diagonal lines
    drawLine( [Ph.f, Pv.b], [(Ph.h + bleed), (Pv.a - bleed)] );
    drawLine( [Ph.f, Pv.b], [(Ph.f - Pv.b - bleed), -bleed] );
    drawLine( [Ph.c, Pv.b], [(Ph.c + Pv.b + bleed), -bleed] );
    drawLine( [Ph.c, Pv.b], [(Ph.c - Pv.b - bleed), -bleed] );
    drawLine( [(Ph.a + Pv.a + bleed), -bleed], [-bleed, (Pv.a + BAG_SIZES.glueMargin + bleed)] );

    //----- Horisontal sizes
    drawText( pt2mm(BAG_SIZES.glueMargin) , [BAG_SIZES.glueMargin/2 - 13, (bH - 10)] );
    drawText( pt2mm(BAG_SIZES.width) , [(Ph.a+Ph.b)/2 - 13, (bH - 10)] );
    drawText( pt2mm(BAG_SIZES.depth/2) , [(Ph.b+Ph.c)/2 - 13, (bH - 10)] );
    drawText( pt2mm(BAG_SIZES.depth/2) , [(Ph.c+Ph.d)/2 - 13, (bH - 10)] );
    drawText( pt2mm(BAG_SIZES.width) , [(Ph.d+Ph.e)/2 - 13, (bH - 10)] );
    drawText( pt2mm(BAG_SIZES.depth/2) , [(Ph.e+Ph.f)/2 - 13, (bH - 10)] );
    drawText( pt2mm(BAG_SIZES.depth/2) , [(Ph.f+Ph.h)/2 - 13, (bH - 10)] );

    //----- Vertical sizes
    drawText( pt2mm(BAG_SIZES.depth/2+BAG_SIZES.bottomMargin) , [10, Pv.a/2] , 90);
    drawText( pt2mm(BAG_SIZES.height) , [10, (Pv.a+Pv.c)/2] , 90);
    drawText( pt2mm(BAG_SIZES.handleMargin) , [10, (Pv.c+Pv.d)/2] , 90);
};


function throwWarn(){ // *** Warning ***

    drawText( 'The bag will not fit into any paper.\nTry decrease margins, bleeds or bag size.' , [docRef.visibleBounds[2]/2, docRef.visibleBounds[1]/1.8] );
       drawText( 
           (  '\nCurrent size: ' + Math.round(pt2mm(docRef.visibleBounds[2]-docRef.visibleBounds[0]))
            + ' x '+ Math.round(pt2mm(docRef.visibleBounds[1]-docRef.visibleBounds[3])) +' mm'
            + '\nMax size: '+ Math.round(pt2mm(KNIFE_MAX_SIZE.width))             
            + ' x '+ Math.round(pt2mm(KNIFE_MAX_SIZE.height)) +' mm' ), 
           [docRef.visibleBounds[2]/2, docRef.visibleBounds[1]/2.2] 
           );
};



switch (force) {
    case "forcefull":
        drawFullDiecut();
        break;

    case "forcehalf":
        drawHalfDiecut();
        break;

    default:
        if ( (bW+bleed*2 < KNIFE_MAX_SIZE.width && bH+bleed*2 < KNIFE_MAX_SIZE.height) || 
             (bH+bleed*2 < KNIFE_MAX_SIZE.width && bW+bleed*2 < KNIFE_MAX_SIZE.height) ) {
            
            drawFullDiecut();                   

        } else {

            drawHalfDiecut();

            if ( (bW+bleed*2 > KNIFE_MAX_SIZE.width && bH+bleed*2 > KNIFE_MAX_SIZE.height) || 
                 (bH+bleed*2 > KNIFE_MAX_SIZE.width && bW+bleed*2 > KNIFE_MAX_SIZE.height) ) {

                throwWarn();

            };
        };

        break;
};



var visibleBounds = docRef.visibleBounds;

var artboardSize = [];
artboardSize[0] = visibleBounds[0] + bleed;
artboardSize[1] = visibleBounds[1] - bleed;
artboardSize[2] = visibleBounds[2] - bleed;
artboardSize[3] = visibleBounds[3] + bleed;

docRef.artboards[0].artboardRect = artboardSize;
