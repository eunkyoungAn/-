import sys,cv2,numpy as np,mediapipe as mp
from mediapipe.tasks.python import vision,BaseOptions
seg=vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(base_options=BaseOptions(model_asset_path='/tmp/claude-0/-home-user--/922154c2-f7c3-51b6-9809-e606cc8d84d3/scratchpad/selfie_multiclass_256x256.tflite'),output_confidence_masks=True))
for f in sys.argv[1:]:
    bgr=cv2.imread(f);rgb=cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB)
    r=seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB,data=rgb))
    bg=r.confidence_masks[0].numpy_view()
    a=np.clip(1-bg,0,1);a=cv2.resize(a,(bgr.shape[1],bgr.shape[0]),interpolation=cv2.INTER_CUBIC)
    a=cv2.morphologyEx(a,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(41,41)));a=cv2.GaussianBlur(a,(5,5),0);a=np.clip((a-.35)/.3,0,1)
    out=np.dstack([bgr,(a*255).astype(np.uint8)]);cv2.imwrite(f.rsplit('.',1)[0]+'_cut.png',out)
