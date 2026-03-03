<?php
/**
 * Admin Panel Header Template
 */
$currentUser = getCurrentUser();
$flash = getFlashMessages();
$currentPage = basename($_SERVER['PHP_SELF'], '.php');
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e($pageTitle ?? 'Dashboard') ?> - <?= e(SITE_NAME) ?></title>
    <link rel="stylesheet" href="assets/admin.css">
</head>
<body>
    <div class="admin-wrapper">
        <aside class="sidebar">
            <div class="sidebar-header">
                <h2>E-İçerik Admin</h2>
            </div>
            <nav class="sidebar-nav">
                <a href="index.php" class="nav-item <?= $currentPage === 'index' ? 'active' : '' ?>">
                    <span class="nav-icon">📊</span> Dashboard
                </a>
                <a href="records.php" class="nav-item <?= $currentPage === 'records' ? 'active' : '' ?>">
                    <span class="nav-icon">📋</span> Kayıtlar
                </a>
                <a href="record_form.php" class="nav-item <?= $currentPage === 'record_form' && empty($_GET['id']) ? 'active' : '' ?>">
                    <span class="nav-icon">➕</span> Yeni Kayıt
                </a>
                <a href="excel_import.php" class="nav-item <?= $currentPage === 'excel_import' ? 'active' : '' ?>">
                    <span class="nav-icon">📥</span> Excel İçe Aktar
                </a>
                <a href="export.php" class="nav-item <?= $currentPage === 'export' ? 'active' : '' ?>">
                    <span class="nav-icon">📤</span> JSON Export
                </a>
                <a href="backup.php" class="nav-item <?= $currentPage === 'backup' ? 'active' : '' ?>">
                    <span class="nav-icon">💾</span> Yedekleme
                </a>
                <a href="audit_log.php" class="nav-item <?= $currentPage === 'audit_log' ? 'active' : '' ?>">
                    <span class="nav-icon">📜</span> Değişiklik Geçmişi
                </a>
            </nav>
            <div class="sidebar-footer">
                <div class="user-info">
                    <span>👤 <?= e($currentUser['username'] ?? 'Misafir') ?></span>
                </div>
                <a href="logout.php" class="logout-btn">Çıkış</a>
            </div>
        </aside>
        
        <main class="main-content">
            <header class="top-bar">
                <h1><?= e($pageTitle ?? 'Dashboard') ?></h1>
            </header>
            
            <div class="content-area">
                <?php if ($flash['success']): ?>
                    <div class="alert alert-success"><?= e($flash['success']) ?></div>
                <?php endif; ?>
                
                <?php if ($flash['error']): ?>
                    <div class="alert alert-error"><?= e($flash['error']) ?></div>
                <?php endif; ?>

