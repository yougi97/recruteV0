import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from pathlib import Path
import threading
import cvvect
import simil_match


class CVJobMatcherGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("CV ◄► Job Matcher")
        self.root.geometry("900x750")
        
        self.cv_path = None
        self.cv_embedding = None
        self.cv_text = ""
        self.job_embedding = None
        
        self.setup_ui()
    
    def setup_ui(self):
        # ===== CV SECTION =====
        cv_frame = ttk.LabelFrame(self.root, text="CV Selection", padding=10)
        cv_frame.pack(fill="x", padx=10, pady=10)
        
        self.cv_label = tk.Label(cv_frame, text="No CV selected", fg="gray")
        self.cv_label.pack(side="left", padx=5)
        
        tk.Button(cv_frame, text="Browse PDF...", command=self.select_cv, bg="#2196F3", fg="white").pack(side="left", padx=5)
        self.btn_load_cv = tk.Button(cv_frame, text="Process CV", command=self.process_cv, state="disabled", bg="#2196F3", fg="white")
        self.btn_load_cv.pack(side="left", padx=5)
        
        self.cv_status = tk.Label(cv_frame, text="", fg="blue")
        self.cv_status.pack(side="left", padx=5)
        
        # ===== JOB SECTION =====
        job_frame = ttk.LabelFrame(self.root, text="Job Description", padding=10)
        job_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Mode selection
        mode_frame = tk.Frame(job_frame)
        mode_frame.pack(fill="x", pady=(0, 10))
        
        self.job_mode = tk.StringVar(value="text")
        tk.Radiobutton(mode_frame, text="Write Job Description", variable=self.job_mode, 
                      value="text", command=self.switch_job_mode).pack(side="left", padx=5)
        tk.Radiobutton(mode_frame, text="Load from File", variable=self.job_mode, 
                      value="file", command=self.switch_job_mode).pack(side="left", padx=5)
        
        # Text input
        text_label = tk.Label(job_frame, text="Job Description:")
        text_label.pack(anchor="w", padx=5)
        
        self.job_text = tk.Text(job_frame, height=8, width=80, wrap="word")
        self.job_text.pack(fill="both", expand=True, padx=5, pady=5)
        
        scrollbar = ttk.Scrollbar(self.job_text)
        scrollbar.pack(side="right", fill="y")
        self.job_text.config(yscrollcommand=scrollbar.set)
        scrollbar.config(command=self.job_text.yview)
        
        # File button (hidden initially)
        button_frame = tk.Frame(job_frame)
        button_frame.pack(fill="x", padx=5, pady=5)
        
        self.btn_load_job = tk.Button(button_frame, text="Load Job File...", 
                                      command=self.select_job_file, state="disabled", bg="#FF9800", fg="white")
        self.btn_load_job.pack(side="left", padx=5)
        
        self.job_file_label = tk.Label(button_frame, text="", fg="gray")
        self.job_file_label.pack(side="left", padx=5)
        
        # ===== COMPUTE SECTION =====
        compute_frame = tk.Frame(self.root)
        compute_frame.pack(fill="x", padx=10, pady=10)
        
        self.btn_compute = tk.Button(compute_frame, text="Compute Similarity", 
                                     command=self.compute_similarity, 
                                     bg="#4CAF50", fg="white", font=("Arial", 12, "bold"),
                                     state="disabled")
        self.btn_compute.pack(side="left", padx=5)
        
        self.clear_btn = tk.Button(compute_frame, text="Clear All", command=self.clear_all, bg="#f44336", fg="white")
        self.clear_btn.pack(side="left", padx=5)
        
        # ===== RESULT SECTION =====
        result_frame = ttk.LabelFrame(self.root, text="Similarity Result", padding=10)
        result_frame.pack(fill="x", padx=10, pady=10)
        
        self.result_label = tk.Label(result_frame, text="No result yet", 
                                     font=("Arial", 14, "bold"), fg="gray")
        self.result_label.pack(pady=10)
        
        self.progress = ttk.Progressbar(result_frame, mode='indeterminate')
        self.progress.pack(fill="x", pady=5)
        
        # ===== STATUS =====
        self.status_bar = tk.Label(self.root, text="Ready", relief="sunken", anchor="w")
        self.status_bar.pack(fill="x", side="bottom")
    
    def switch_job_mode(self):
        mode = self.job_mode.get()
        if mode == "file":
            self.job_text.config(state="disabled")
            self.btn_load_job.config(state="normal")
        else:
            self.job_text.config(state="normal")
            self.btn_load_job.config(state="disabled")
            self.job_file_label.config(text="")
    
    def select_cv(self):
        file = filedialog.askopenfilename(
            title="Select CV (PDF)",
            filetypes=[("PDF files", "*.pdf"), ("All files", "*.*")],
            initialdir=str(Path(__file__).parent)
        )
        if file:
            self.cv_path = file
            filename = Path(file).name
            self.cv_label.config(text=f"📄 {filename}", fg="black")
            self.btn_load_cv.config(state="normal")
            self.cv_status.config(text="")
            self.update_status(f"Selected CV: {filename}")
    
    def process_cv(self):
        if not self.cv_path:
            messagebox.showerror("Error", "No CV selected")
            return
        
        self.progress.start()
        self.btn_load_cv.config(state="disabled")
        self.update_status("Processing CV...")
        
        threading.Thread(target=self._process_cv_thread, daemon=True).start()
    
    def _process_cv_thread(self):
        try:
            # Extract raw text and embedding
            self.cv_text = cvvect.extract_text_from_pdf(self.cv_path)
            self.cv_embedding = cvvect.process_cv(self.cv_path)
            self.root.after(0, self._cv_processed)
        except Exception as e:
            self.root.after(0, lambda: self._cv_error(str(e)))
    
    def _cv_processed(self):
        self.progress.stop()
        self.cv_status.config(text="✓ Processed", fg="green")
        self.update_status("CV processed successfully")
        self.btn_compute.config(state="normal")
        self.btn_load_cv.config(state="normal")
    
    def _cv_error(self, error):
        self.progress.stop()
        messagebox.showerror("CV Processing Error", f"Failed to process CV:\n{error}")
        self.btn_load_cv.config(state="normal")
        self.update_status(f"Error: {error}")
    
    def select_job_file(self):
        file = filedialog.askopenfilename(
            title="Select Job Descriptions File (TXT)",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")],
            initialdir=str(Path(__file__).parent)
        )
        if file:
            try:
                with open(file, 'r', encoding='utf-8') as f:
                    content = f.read()
                self.job_text.config(state="normal")
                self.job_text.delete("1.0", "end")
                self.job_text.insert("1.0", content)
                self.job_text.config(state="disabled")
                
                filename = Path(file).name
                self.job_file_label.config(text=f"📄 {filename}", fg="black")
                self.update_status(f"Loaded job file: {filename}")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to load file:\n{e}")
    
    def compute_similarity(self):
        if self.cv_embedding is None:
            messagebox.showwarning("Warning", "Please process CV first")
            return
        
        job_text = self.job_text.get("1.0", "end").strip()
        if not job_text:
            messagebox.showwarning("Warning", "Job description is empty")
            return
        
        self.progress.start()
        self.btn_compute.config(state="disabled")
        self.update_status("Computing similarity...")
        
        threading.Thread(
            target=self._compute_thread,
            args=(job_text,),
            daemon=True
        ).start()
    
    def _compute_thread(self, job_text):
        try:
            cleaned_job = cvvect.clean_text(job_text)
            self.job_embedding = cvvect.embed_text(cleaned_job)
            
            # Use enhanced matching with cleaned CV text
            result = simil_match.compute_similarity_enhanced(
                cv_text=self.cv_text if hasattr(self, 'cv_text') else '',
                job_text=job_text,
                cv_vector=self.cv_embedding,
                job_vector=self.job_embedding
            )
            self.root.after(0, lambda: self._show_result(result))
        except Exception as e:
            self.root.after(0, lambda: self._compute_error(str(e)))
    
    def _show_result(self, result):
        self.progress.stop()
        combined_sim = result['combined']
        embedding_sim = result['embedding']
        keyword_bonus = result.get('keyword_bonus', 0.0)
        
        percentage = combined_sim * 100
        color = "green" if combined_sim > 0.6 else "orange" if combined_sim > 0.4 else "red"
        
        # Main score
        score_text = f"Score: {combined_sim:.2%} ({percentage:.1f}%)"
        bonus_text = f" +{keyword_bonus:.2%}" if keyword_bonus > 0 else ""
        detail_text = f"Semantic match: {embedding_sim:.2%}{bonus_text}"
        
        if result.get('matched_keywords'):
            matched = ", ".join(sorted(result['matched_keywords'])[:6])
            if len(result['matched_keywords']) > 6:
                matched += f" +{len(result['matched_keywords']) - 6} more"
            detail_text += f"\nMatched: {matched}"
        
        self.result_label.config(text=f"{score_text}\n{detail_text}", fg=color)
        self.btn_compute.config(state="normal")
        self.update_status(f"Similarity computed: {combined_sim:.2%}")
    
    def _compute_error(self, error):
        self.progress.stop()
        messagebox.showerror("Computation Error", f"Failed to compute similarity:\n{error}")
        self.btn_compute.config(state="normal")
        self.update_status(f"Error: {error}")
    
    def clear_all(self):
        self.cv_path = None
        self.cv_embedding = None
        self.cv_text = ""
        self.job_embedding = None
        
        self.cv_label.config(text="No CV selected", fg="gray")
        self.cv_status.config(text="")
        self.job_text.config(state="normal")
        self.job_text.delete("1.0", "end")
        self.job_file_label.config(text="")
        self.result_label.config(text="No result yet", fg="gray")
        
        self.btn_load_cv.config(state="disabled")
        self.btn_compute.config(state="disabled")
        self.job_text.config(state="normal")
        
        self.update_status("Cleared")
    
    def update_status(self, message):
        self.status_bar.config(text=message)


if __name__ == "__main__":
    root = tk.Tk()
    app = CVJobMatcherGUI(root)
    root.mainloop()
