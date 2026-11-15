<?php

namespace App\Support;

use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;

/**
 * إعدادات mPDF الموحّدة لملفات دفة: خط الهوية IBM Plex Sans Arabic (رخصة OFL)
 * مع إبقاء DejaVu Sans احتياطيًا للرموز.
 */
class PdfBrand
{
    public static function config(array $overrides = []): array
    {
        $fontDirs = (new ConfigVariables())->getDefaults()['fontDir'];
        $fontData = (new FontVariables())->getDefaults()['fontdata'];

        return array_merge([
            'fontDir'  => array_merge($fontDirs, [resource_path('fonts')]),
            'fontdata' => $fontData + [
                'plexarabic' => [
                    'R'          => 'IBMPlexSansArabic-Regular.ttf',
                    'B'          => 'IBMPlexSansArabic-Bold.ttf',
                    'useOTL'     => 0xFF,
                    'useKashida' => 75,
                ],
            ],
            'default_font' => 'plexarabic',
        ], $overrides, ['default_font' => 'plexarabic']);
    }
}
