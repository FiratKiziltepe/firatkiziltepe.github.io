<?php
/**
 * Excel Export - Filtrelenmiş kayıtları Excel olarak indir
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

requireAuth();

// Filtreleri al
$filters = [
    'search' => trim($_GET['search'] ?? ''),
    'ders_adi' => $_GET['ders_adi'] ?? [],
    'program_turu' => trim($_GET['program_turu'] ?? '')
];

// Ders adı string olarak geldiyse diziye çevir
if (is_string($filters['ders_adi'])) {
    $filters['ders_adi'] = $filters['ders_adi'] ? [$filters['ders_adi']] : [];
}

// Kayıtları getir (çoklu ders destekli)
$result = getRecordsAdvanced(1, 99999, $filters);
$records = $result['records'];

if (empty($records)) {
    setFlashError('Dışa aktarılacak kayıt bulunamadı.');
    header('Location: records.php');
    exit;
}

// Dosya adı oluştur
$filename = 'e-icerik-kayitlar-' . date('Y-m-d-His') . '.xlsx';

// Excel XLSX formatında export (SimpleXLSXGen benzeri basit implementasyon)
header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Cache-Control: max-age=0');

// Basit XLSX oluştur
$xlsx = new SimpleXLSXWriter();
$xlsx->setAuthor('E-İçerik Admin');

// Header satırı
$headers = ['SIRA NO', 'DERS ADI', 'ÜNİTE/TEMA/ ÖĞRENME ALANI', 'KAZANIM/ÖĞRENME ÇIKTISI/BÖLÜM', 'E-İÇERİK TÜRÜ', 'AÇIKLAMA', 'Program Türü'];
$xlsx->addRow($headers, true);

// Veri satırları
foreach ($records as $record) {
    $xlsx->addRow([
        $record['sira_no'] ?? '',
        $record['ders_adi'] ?? '',
        $record['unite_tema'] ?? '',
        $record['kazanim'] ?? '',
        $record['eicerik_turu'] ?? '',
        $record['aciklama'] ?? '',
        $record['program_turu'] ?? ''
    ]);
}

$xlsx->output();
exit;

/**
 * Basit XLSX Writer Sınıfı
 * Harici kütüphane gerektirmez
 */
class SimpleXLSXWriter {
    private $rows = [];
    private $author = 'Admin';
    
    public function setAuthor($author) {
        $this->author = $author;
    }
    
    public function addRow($data, $isHeader = false) {
        $this->rows[] = ['data' => $data, 'isHeader' => $isHeader];
    }
    
    public function output() {
        $tempFile = tempnam(sys_get_temp_dir(), 'xlsx');
        
        $zip = new ZipArchive();
        $zip->open($tempFile, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        
        // [Content_Types].xml
        $zip->addFromString('[Content_Types].xml', $this->getContentTypes());
        
        // _rels/.rels
        $zip->addFromString('_rels/.rels', $this->getRels());
        
        // xl/_rels/workbook.xml.rels
        $zip->addFromString('xl/_rels/workbook.xml.rels', $this->getWorkbookRels());
        
        // xl/workbook.xml
        $zip->addFromString('xl/workbook.xml', $this->getWorkbook());
        
        // xl/styles.xml
        $zip->addFromString('xl/styles.xml', $this->getStyles());
        
        // xl/sharedStrings.xml
        $zip->addFromString('xl/sharedStrings.xml', $this->getSharedStrings());
        
        // xl/worksheets/sheet1.xml
        $zip->addFromString('xl/worksheets/sheet1.xml', $this->getSheet());
        
        $zip->close();
        
        readfile($tempFile);
        unlink($tempFile);
    }
    
    private function getContentTypes() {
        return '<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
    <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
    <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
    <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>';
    }
    
    private function getRels() {
        return '<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>';
    }
    
    private function getWorkbookRels() {
        return '<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
    <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
    <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>';
    }
    
    private function getWorkbook() {
        return '<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
    <sheets>
        <sheet name="Kayıtlar" sheetId="1" r:id="rId1"/>
    </sheets>
</workbook>';
    }
    
    private function getStyles() {
        return '<?xml version="1.0" encoding="UTF-8"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
    <fonts count="2">
        <font><sz val="11"/><name val="Calibri"/></font>
        <font><b/><sz val="11"/><name val="Calibri"/></font>
    </fonts>
    <fills count="3">
        <fill><patternFill patternType="none"/></fill>
        <fill><patternFill patternType="gray125"/></fill>
        <fill><patternFill patternType="solid"><fgColor rgb="FF4472C4"/></patternFill></fill>
    </fills>
    <borders count="1"><border/></borders>
    <cellStyleXfs count="1"><xf/></cellStyleXfs>
    <cellXfs count="2">
        <xf fontId="0" fillId="0" borderId="0"/>
        <xf fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1"/>
    </cellXfs>
</styleSheet>';
    }
    
    private function getSharedStrings() {
        $strings = [];
        foreach ($this->rows as $row) {
            foreach ($row['data'] as $cell) {
                $val = (string) $cell;
                if (!in_array($val, $strings)) {
                    $strings[] = $val;
                }
            }
        }
        
        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="' . count($strings) . '" uniqueCount="' . count($strings) . '">';
        foreach ($strings as $str) {
            $xml .= '<si><t>' . htmlspecialchars($str, ENT_XML1, 'UTF-8') . '</t></si>';
        }
        $xml .= '</sst>';
        return $xml;
    }
    
    private function getStringIndex($value) {
        static $cache = null;
        if ($cache === null) {
            $cache = [];
            $index = 0;
            foreach ($this->rows as $row) {
                foreach ($row['data'] as $cell) {
                    $val = (string) $cell;
                    if (!isset($cache[$val])) {
                        $cache[$val] = $index++;
                    }
                }
            }
        }
        return $cache[(string)$value] ?? 0;
    }
    
    private function getSheet() {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">';
        $xml .= '<sheetData>';
        
        $rowNum = 1;
        foreach ($this->rows as $row) {
            $xml .= '<row r="' . $rowNum . '">';
            $colNum = 0;
            foreach ($row['data'] as $cell) {
                $col = chr(65 + $colNum); // A, B, C, ...
                if ($colNum > 25) {
                    $col = 'A' . chr(65 + ($colNum - 26));
                }
                $cellRef = $col . $rowNum;
                $style = $row['isHeader'] ? ' s="1"' : '';
                $stringIndex = $this->getStringIndex($cell);
                $xml .= '<c r="' . $cellRef . '" t="s"' . $style . '><v>' . $stringIndex . '</v></c>';
                $colNum++;
            }
            $xml .= '</row>';
            $rowNum++;
        }
        
        $xml .= '</sheetData>';
        $xml .= '</worksheet>';
        return $xml;
    }
}

