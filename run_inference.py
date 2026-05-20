import torch
from modelscope import QwenImageEditPlusPipeline
from PIL import Image
import numpy as np
import sys

print("Loading pipeline...", flush=True)
pipe = QwenImageEditPlusPipeline.from_pretrained(
    "/home/qyjgylc_whf/.cache/modelscope/hub/models/Qwen/Qwen-Image-Edit-2511",
    torch_dtype=torch.float16,
)

print("Enabling sequential_cpu_offload...", flush=True)
pipe.enable_sequential_cpu_offload()
print("Done enabling offload.", flush=True)

def _pipe_eval():
    for nm in ("transformer", "vae", "text_encoder"):
        o = getattr(pipe, nm, None)
        if o is not None and callable(getattr(o, "eval", None)):
            o.eval()
pipe.eval = _pipe_eval

img = Image.open("/home/qyjgylc_whf/code/trai/12121.png").resize((1024, 1024))
img.load()

print("Running inference...", flush=True)
r = pipe(image=img, prompt="wearing glasses", height=1024, width=1024, num_inference_steps=5)
print("Inference done!", flush=True)

out = r.images[0]
arr = np.array(out)
print("Output: min=%d max=%d mean=%.1f" % (arr.min(), arr.max(), arr.mean()), flush=True)

out.save("/home/qyjgylc_whf/code/trai/12121_glasses.png")
print("Saved to 12121_glasses.png", flush=True)
