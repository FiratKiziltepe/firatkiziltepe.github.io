            </div>
        </main>
    </div>
    
    <script>
        // Alert'leri otomatik kapat
        document.querySelectorAll('.alert').forEach(alert => {
            setTimeout(() => {
                alert.style.opacity = '0';
                setTimeout(() => alert.remove(), 300);
            }, 5000);
        });
        
        // Silme onayı
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
                    e.preventDefault();
                }
            });
        });
    </script>
</body>
</html>

