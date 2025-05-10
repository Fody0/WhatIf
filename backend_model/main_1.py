from fastapi import FastAPI
from llama_cpp import Llama
from pydantic import BaseModel

app = FastAPI()

class PromptRequest(BaseModel):
    prompt: str

# Initialize model
llm = None

@app.on_event("startup")
async def load_model():
    global llm
    llm = Llama(
        model_path="C:/Users/user/Desktop/Hack/models/mistral-7b-instruct-v0.2.Q4_K_M.gguf",
        n_ctx=4096,
        n_gpu_layers=45,          # Critical for 12GB VRAM
        n_threads=6,              # Physical CPU cores
        n_batch=512,
        use_mmap=False,           # Disable mmap for stability
        use_mlock=True,
        rope_freq_base=10000,     # Essential for Russian
        logits_all=False
    )

    #    model_path="C:/Users/user/Desktop/Hack/models/bloomz-7b1.i1-Q5_K_M.gguf",
    # llm = Llama(
    # model_path="C:/Users/user/Desktop/Hack/models/mistral-7b-instruct-v0.2.Q4_K_M.gguf",
    # n_ctx=2048,                # Reduced context for 6GB VRAM
    # n_gpu_layers=22,           # Offload 22 layers to GPU
    # n_threads=6,               # Match your CPU core count
    # n_batch=512,               # Smaller batches for VRAM
    # offload_kqv=True,          # Essential optimization
    # main_gpu=0,
    # tensor_split=[0.9],        # Reserve 10% VRAM headroom
    # mul_mat_q=True,
    # flash_attn=False,          # Disable for Turing arch
    # low_vram=True,             # Enable memory optimizations
    # lock_alloc=False           # Better for mobile GPUs
    # )


@app.post("/generate")
async def generate_text(request: PromptRequest):
    # Simplified Russian prompt template
    formatted_prompt = f"""Отвечай как историк. Вопрос: {request.prompt}
Ответ:"""
    
    response = llm.create_completion(
        prompt=formatted_prompt,
        max_tokens=512,
        temperature=0.7,
        top_p=0.9,
        repeat_penalty=1.1,
        mirostat_mode=0,
        stop=["\n\n"],
        echo=False
    )
    
    return {"response": response["choices"][0]["text"].strip()}