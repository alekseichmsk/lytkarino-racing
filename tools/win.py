import numpy as np,glob,os,json
from PIL import Image,ImageFilter
from scipy import ndimage as nd
def windows(a,F,thr=18):
  L=a.mean(2);S=a.max(2)-a.min(2)
  Ls=nd.uniform_filter(L,5);loc=nd.uniform_filter(L,int(1024/F*0.9))
  c=(loc-Ls)>thr
  c=nd.binary_opening(c,iterations=1);c=nd.binary_closing(c,iterations=2)
  lab,n=nd.label(c);rects=[]
  fh=1024/F
  for i,sl in enumerate(nd.find_objects(lab)):
    h=sl[0].stop-sl[0].start;w=sl[1].stop-sl[1].start
    if h<fh*.15 or h>fh*1.0 or w<10 or w>260 or w>h*4:continue
    fill=(lab[sl]==i+1).mean()
    if fill<.4:continue
    rects.append((sl[0].start,sl[0].stop,sl[1].start,sl[1].stop))
  return rects
def emissive(a,F,seed=1):
  rng=np.random.default_rng(seed);R=max((windows(a,F,t) for t in (18,12,8,5)),key=len);e=np.zeros(a.shape[:2]+(3,));
  for (y0,y1,x0,x1) in R:
    if rng.random()>.42:continue
    dy=int((y1-y0)*.08);dx=int((x1-x0)*.1);col=np.array([255,205,140])*(.75+.25*rng.random())
    if rng.random()<.25:col=np.array([210,225,255])*(.7+.2*rng.random())
    e[y0+dy:y1-dy,x0+dx:x1-dx]=col
  # keep glass only: suppress very bright pixels (frames/sills)
  L=a.mean(2);e*=(L<np.percentile(L,70))[...,None]*.7+.3
  return np.asarray(Image.fromarray(e.astype('uint8')).filter(ImageFilter.GaussianBlur(1))),len(R)
