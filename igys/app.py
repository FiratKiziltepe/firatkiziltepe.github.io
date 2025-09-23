from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///igys.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Login Manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Bu sayfaya erişmek için giriş yapmalısınız.'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Modeller
class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    ad = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    rol = db.Column(db.String(20), nullable=False)  # admin, baskan, uye
    
    # İlişkiler
    led_commissions = db.relationship('Commission', backref='baskan', lazy=True, foreign_keys='Commission.baskan_id')
    memberships = db.relationship('CommissionMember', backref='user', lazy=True)
    reviews = db.relationship('Review', backref='user', lazy=True)

class Commission(db.Model):
    __tablename__ = 'commissions'
    id = db.Column(db.Integer, primary_key=True)
    isim = db.Column(db.String(100), nullable=False)
    baskan_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    olusturma_tarihi = db.Column(db.DateTime, default=datetime.utcnow)
    sure = db.Column(db.Integer, default=7)  # gün cinsinden
    
    # İlişkiler
    members = db.relationship('CommissionMember', backref='commission', lazy=True)
    reviews = db.relationship('Review', backref='commission', lazy=True)

class CommissionMember(db.Model):
    __tablename__ = 'commission_members'
    id = db.Column(db.Integer, primary_key=True)
    commission_id = db.Column(db.Integer, db.ForeignKey('commissions.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

class Content(db.Model):
    __tablename__ = 'contents'
    id = db.Column(db.Integer, primary_key=True)
    baslik = db.Column(db.String(200), nullable=False)
    durum = db.Column(db.String(50), default='beklemede')  # beklemede, incelemede, tamamlandi, yegitek
    admin_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    olusturma_tarihi = db.Column(db.DateTime, default=datetime.utcnow)
    
    # İlişkiler
    admin = db.relationship('User', backref='contents', lazy=True)
    reviews = db.relationship('Review', backref='content', lazy=True)

class Review(db.Model):
    __tablename__ = 'reviews'
    id = db.Column(db.Integer, primary_key=True)
    content_id = db.Column(db.Integer, db.ForeignKey('contents.id'), nullable=False)
    commission_id = db.Column(db.Integer, db.ForeignKey('commissions.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    durum = db.Column(db.String(50), default='beklemede')  # beklemede, tamamlandi
    tarih = db.Column(db.DateTime, default=datetime.utcnow)
    
    # İlişkiler
    findings = db.relationship('Finding', backref='review', lazy=True)

class Finding(db.Model):
    __tablename__ = 'findings'
    id = db.Column(db.Integer, primary_key=True)
    review_id = db.Column(db.Integer, db.ForeignKey('reviews.id'), nullable=False)
    kategori = db.Column(db.String(100), nullable=False)
    aciklama = db.Column(db.Text, nullable=False)
    durum = db.Column(db.String(50), default='aktif')
    
    # İlişkiler
    corrections = db.relationship('Correction', backref='finding', lazy=True)

class Correction(db.Model):
    __tablename__ = 'corrections'
    id = db.Column(db.Integer, primary_key=True)
    finding_id = db.Column(db.Integer, db.ForeignKey('findings.id'), nullable=False)
    aciklama = db.Column(db.Text)
    yegitek_aciklama = db.Column(db.Text)
    durum = db.Column(db.String(50), default='beklemede')

# Routes
@app.route('/')
def index():
    if current_user.is_authenticated:
        if current_user.rol == 'admin':
            return redirect(url_for('admin_dashboard'))
        elif current_user.rol == 'baskan':
            return redirect(url_for('baskan_dashboard'))
        else:
            return redirect(url_for('uye_dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = User.query.filter_by(email=email).first()
        
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('index'))
        else:
            flash('Geçersiz email veya şifre')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/admin')
@login_required
def admin_dashboard():
    if current_user.rol != 'admin':
        flash('Bu sayfaya erişim yetkiniz yok')
        return redirect(url_for('index'))
    
    contents = Content.query.all()
    commissions = Commission.query.all()
    users = User.query.all()
    
    return render_template('admin/dashboard.html', 
                         contents=contents, 
                         commissions=commissions, 
                         users=users)

@app.route('/baskan')
@login_required
def baskan_dashboard():
    if current_user.rol != 'baskan':
        flash('Bu sayfaya erişim yetkiniz yok')
        return redirect(url_for('index'))
    
    # Başkan olduğu komisyonları getir
    commissions = Commission.query.filter_by(baskan_id=current_user.id).all()
    
    return render_template('baskan/dashboard.html', commissions=commissions)

@app.route('/uye')
@login_required
def uye_dashboard():
    if current_user.rol != 'uye':
        flash('Bu sayfaya erişim yetkiniz yok')
        return redirect(url_for('index'))
    
    # Üye olduğu komisyonlardaki incelemeler
    member_commissions = db.session.query(Commission).join(CommissionMember).filter(
        CommissionMember.user_id == current_user.id
    ).all()
    
    return render_template('uye/dashboard.html', commissions=member_commissions)

# Admin API Routes
@app.route('/admin/content/add', methods=['POST'])
@login_required
def add_content():
    if current_user.rol != 'admin':
        return jsonify({'success': False, 'message': 'Yetkisiz erişim'})
    
    data = request.get_json()
    content = Content(
        baslik=data['title'],
        admin_id=current_user.id
    )
    db.session.add(content)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'İçerik başarıyla eklendi'})

@app.route('/admin/commission/add', methods=['POST'])
@login_required
def add_commission():
    if current_user.rol != 'admin':
        return jsonify({'success': False, 'message': 'Yetkisiz erişim'})
    
    name = request.form['name']
    chair_id = request.form['chair_id']
    duration = request.form['duration']
    member_ids = request.form['member_ids']
    
    import json
    member_ids = json.loads(member_ids)
    
    commission = Commission(
        isim=name,
        baskan_id=chair_id,
        sure=int(duration)
    )
    db.session.add(commission)
    db.session.flush()
    
    # Üyeleri ekle
    for member_id in member_ids:
        member = CommissionMember(
            commission_id=commission.id,
            user_id=member_id
        )
        db.session.add(member)
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Komisyon başarıyla oluşturuldu'})

@app.route('/admin/content/<int:content_id>/assign', methods=['POST'])
@login_required
def assign_content_to_commission():
    if current_user.rol != 'admin':
        return jsonify({'success': False, 'message': 'Yetkisiz erişim'})
    
    data = request.get_json()
    content_id = data.get('content_id')
    commission_id = data.get('commission_id')
    
    content = Content.query.get_or_404(content_id)
    commission = Commission.query.get_or_404(commission_id)
    
    # Bu komisyondaki tüm üyelere inceleme görevi ata
    for member in commission.members:
        existing_review = Review.query.filter_by(
            content_id=content_id,
            commission_id=commission_id,
            user_id=member.user_id
        ).first()
        
        if not existing_review:
            review = Review(
                content_id=content_id,
                commission_id=commission_id,
                user_id=member.user_id,
                durum='beklemede'
            )
            db.session.add(review)
    
    content.durum = 'incelemede'
    db.session.commit()
    
    return jsonify({'success': True, 'message': f'İçerik {commission.isim} komisyonuna atandı'})

@app.route('/admin/assign-modal/<int:content_id>')
@login_required
def get_assign_modal(content_id):
    if current_user.rol != 'admin':
        return jsonify({'success': False, 'message': 'Yetkisiz erişim'})
    
    content = Content.query.get_or_404(content_id)
    commissions = Commission.query.all()
    
    html = f'''
    <div class="mb-3">
        <h6>İçerik: {content.baslik}</h6>
        <small class="text-muted">Durum: {content.durum}</small>
    </div>
    <div class="mb-3">
        <label for="assignCommission" class="form-label">Komisyon Seçin</label>
        <select class="form-control" id="assignCommission" required>
            <option value="">Komisyon seçin...</option>
    '''
    
    for commission in commissions:
        html += f'<option value="{commission.id}">{commission.isim} (Başkan: {commission.baskan.ad})</option>'
    
    html += '''
        </select>
    </div>
    '''
    
    return jsonify({'success': True, 'html': html, 'content_id': content_id})

@app.route('/admin/content/<int:content_id>/send-yegitek', methods=['POST'])
@login_required
def send_to_yegitek(content_id):
    if current_user.rol != 'admin':
        return jsonify({'success': False, 'message': 'Yetkisiz erişim'})
    
    content = Content.query.get_or_404(content_id)
    content.durum = 'yegitek'
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'İçerik Yeğitek\'e gönderildi'})

@app.route('/admin/correction/<int:content_id>')
@login_required
def correction_form(content_id):
    if current_user.rol != 'admin':
        flash('Bu sayfaya erişim yetkiniz yok')
        return redirect(url_for('index'))
    
    content = Content.query.get_or_404(content_id)
    
    # Bu içerikle ilgili tüm tespitleri getir
    findings = db.session.query(Finding).join(Review).filter(
        Review.content_id == content_id
    ).all()
    
    return render_template('admin/correction_form.html', content=content, findings=findings)

@app.route('/admin/content/<int:content_id>/save-corrections', methods=['POST'])
@login_required
def save_corrections(content_id):
    if current_user.rol != 'admin':
        return jsonify({'success': False, 'message': 'Yetkisiz erişim'})
    
    data = request.get_json()
    corrections = data.get('corrections', [])
    general_evaluation = data.get('general_evaluation', '')
    
    # Düzeltme bilgilerini kaydet
    for correction_data in corrections:
        finding_id = correction_data['finding_id']
        status = correction_data['status']
        explanation = correction_data['explanation']
        
        # Mevcut düzeltme kaydını kontrol et
        existing_correction = Correction.query.filter_by(finding_id=finding_id).first()
        
        if existing_correction:
            existing_correction.durum = status
            existing_correction.yegitek_aciklama = explanation
        else:
            correction = Correction(
                finding_id=finding_id,
                durum=status,
                yegitek_aciklama=explanation
            )
            db.session.add(correction)
    
    # İçerik durumunu güncelle
    content = Content.query.get_or_404(content_id)
    content.durum = 'duzeltildi'
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Düzeltmeler başarıyla kaydedildi'})

@app.route('/admin/content/<int:content_id>/return-to-commission', methods=['POST'])
@login_required
def return_to_commission(content_id):
    if current_user.rol != 'admin':
        return jsonify({'success': False, 'message': 'Yetkisiz erişim'})
    
    data = request.get_json()
    reason = data.get('reason')
    commission_type = data.get('commission_type')
    
    content = Content.query.get_or_404(content_id)
    
    if commission_type == 'same':
        # Aynı komisyona geri gönder
        content.durum = 'incelemede'
        # Mevcut incelemeleri sıfırla
        Review.query.filter_by(content_id=content_id).update({'durum': 'beklemede'})
    else:
        # Yeni komisyona atama için durumu beklemede yap
        content.durum = 'beklemede'
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': f'İçerik komisyona geri gönderildi. Neden: {reason}'})

# Başkan API Routes
@app.route('/baskan/report/<int:content_id>/<int:commission_id>')
@login_required
def get_report(content_id, commission_id):
    if current_user.rol != 'baskan':
        return jsonify({'success': False, 'message': 'Yetkisiz erişim'})
    
    commission = Commission.query.get_or_404(commission_id)
    if commission.baskan_id != current_user.id:
        return jsonify({'success': False, 'message': 'Bu komisyonun başkanı değilsiniz'})
    
    reviews = Review.query.filter_by(content_id=content_id, commission_id=commission_id).all()
    
    html = '<div class="table-responsive"><table class="table table-striped">'
    html += '<thead><tr><th>Üye</th><th>Kategori</th><th>Açıklama</th><th>İşlemler</th></tr></thead><tbody>'
    
    for review in reviews:
        for finding in review.findings:
            html += f'''
                <tr data-finding-id="{finding.id}">
                    <td>{review.user.ad}</td>
                    <td class="kategori">{finding.kategori}</td>
                    <td class="aciklama">{finding.aciklama}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="editFinding({finding.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteFinding({finding.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            '''
    
    html += '</tbody></table></div>'
    
    return jsonify({'success': True, 'html': html})

@app.route('/baskan/finding/<int:finding_id>/edit', methods=['POST'])
@login_required
def edit_finding(finding_id):
    if current_user.rol != 'baskan':
        return jsonify({'success': False, 'message': 'Yetkisiz erişim'})
    
    finding = Finding.query.get_or_404(finding_id)
    review = finding.review
    commission = review.commission
    
    if commission.baskan_id != current_user.id:
        return jsonify({'success': False, 'message': 'Bu komisyonun başkanı değilsiniz'})
    
    data = request.get_json()
    finding.kategori = data['kategori']
    finding.aciklama = data['aciklama']
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Tespit güncellendi'})

@app.route('/baskan/finding/<int:finding_id>/delete', methods=['POST'])
@login_required
def delete_finding(finding_id):
    if current_user.rol != 'baskan':
        return jsonify({'success': False, 'message': 'Yetkisiz erişim'})
    
    finding = Finding.query.get_or_404(finding_id)
    review = finding.review
    commission = review.commission
    
    if commission.baskan_id != current_user.id:
        return jsonify({'success': False, 'message': 'Bu komisyonun başkanı değilsiniz'})
    
    db.session.delete(finding)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Tespit silindi'})

@app.route('/baskan/send-to-admin/<int:content_id>/<int:commission_id>', methods=['POST'])
@login_required
def send_report_to_admin(content_id, commission_id):
    if current_user.rol != 'baskan':
        return jsonify({'success': False, 'message': 'Yetkisiz erişim'})
    
    commission = Commission.query.get_or_404(commission_id)
    if commission.baskan_id != current_user.id:
        return jsonify({'success': False, 'message': 'Bu komisyonun başkanı değilsiniz'})
    
    content = Content.query.get_or_404(content_id)
    content.durum = 'tamamlandi'
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Rapor admin paneline gönderildi'})

# Üye API Routes
@app.route('/uye/review/<int:review_id>')
@login_required
def get_review(review_id):
    if current_user.rol != 'uye':
        return jsonify({'success': False, 'message': 'Yetkisiz erişim'})
    
    review = Review.query.get_or_404(review_id)
    if review.user_id != current_user.id:
        return jsonify({'success': False, 'message': 'Bu inceleme size ait değil'})
    
    return jsonify({
        'success': True,
        'content': {'baslik': review.content.baslik},
        'commission': {'isim': review.commission.isim, 'sure': review.commission.sure}
    })

@app.route('/uye/review/<int:review_id>/complete', methods=['POST'])
@login_required
def complete_review(review_id):
    if current_user.rol != 'uye':
        return jsonify({'success': False, 'message': 'Yetkisiz erişim'})
    
    review = Review.query.get_or_404(review_id)
    if review.user_id != current_user.id:
        return jsonify({'success': False, 'message': 'Bu inceleme size ait değil'})
    
    data = request.get_json()
    findings = data.get('findings', [])
    
    # Mevcut tespitleri sil
    Finding.query.filter_by(review_id=review_id).delete()
    
    # Yeni tespitleri ekle
    for finding_data in findings:
        finding = Finding(
            review_id=review_id,
            kategori=finding_data['category'],
            aciklama=finding_data['description']
        )
        db.session.add(finding)
    
    review.durum = 'tamamlandi'
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'İnceleme tamamlandı'})

@app.route('/uye/findings/<int:review_id>')
@login_required
def get_user_findings(review_id):
    if current_user.rol != 'uye':
        return jsonify({'success': False, 'message': 'Yetkisiz erişim'})
    
    review = Review.query.get_or_404(review_id)
    if review.user_id != current_user.id:
        return jsonify({'success': False, 'message': 'Bu inceleme size ait değil'})
    
    findings = [{
        'kategori': f.kategori,
        'aciklama': f.aciklama
    } for f in review.findings]
    
    return jsonify({'success': True, 'findings': findings})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Demo veriler oluştur
        if not User.query.first():
            admin = User(
                ad='Admin User',
                email='admin@ttkb.gov.tr',
                password_hash=generate_password_hash('admin123'),
                rol='admin'
            )
            db.session.add(admin)
            
            baskan = User(
                ad='Komisyon Başkanı',
                email='baskan@ttkb.gov.tr',
                password_hash=generate_password_hash('baskan123'),
                rol='baskan'
            )
            db.session.add(baskan)
            
            uye = User(
                ad='Komisyon Üyesi',
                email='uye@ttkb.gov.tr',
                password_hash=generate_password_hash('uye123'),
                rol='uye'
            )
            db.session.add(uye)
            
            db.session.commit()
            
            # Demo komisyon ve içerik oluştur
            demo_commission = Commission(
                isim='Türkçe İnceleme Komisyonu',
                baskan_id=baskan.id,
                sure=7
            )
            db.session.add(demo_commission)
            db.session.flush()
            
            # Üye ekle
            member = CommissionMember(
                commission_id=demo_commission.id,
                user_id=uye.id
            )
            db.session.add(member)
            
            # Demo içerik
            demo_content = Content(
                baslik='5. Sınıf Matematik Ders Kitabı',
                admin_id=admin.id,
                durum='incelemede'
            )
            db.session.add(demo_content)
            db.session.flush()
            
            # Demo inceleme görevi
            demo_review = Review(
                content_id=demo_content.id,
                commission_id=demo_commission.id,
                user_id=uye.id,
                durum='beklemede'
            )
            db.session.add(demo_review)
            db.session.flush()
            
            # Demo tespit
            demo_finding = Finding(
                review_id=demo_review.id,
                kategori='Yazım Hatası',
                aciklama='Sayfa 15\'te "matematik" kelimesi "matemaitk" olarak yazılmış.',
                durum='aktif'
            )
            db.session.add(demo_finding)
            
            # Başka bir demo tespit
            demo_finding2 = Finding(
                review_id=demo_review.id,
                kategori='İçerik Hatası',
                aciklama='Sayfa 23\'teki örnek problemde sonuç yanlış hesaplanmış.',
                durum='aktif'
            )
            db.session.add(demo_finding2)
            
            db.session.commit()
    
    app.run(debug=True)
