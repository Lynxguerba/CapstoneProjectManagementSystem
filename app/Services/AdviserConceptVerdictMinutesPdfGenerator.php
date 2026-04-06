<?php

namespace App\Services;

use Carbon\CarbonInterface;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class AdviserConceptVerdictMinutesPdfGenerator
{
    private const PAGE_WIDTH = 595.0;

    private const PAGE_HEIGHT = 842.0;

    /**
     * @param  array<int, string>  $proponentNames
     * @param  array<int, string>  $memberPanelistNames
     * @param  array<int, array{panelist: string, comments: array<int, string>}>  $commentsByPanelist
     */
    public function generate(
        string $signatureDataUrl,
        string $adviserName,
        CarbonInterface $signedAt,
        string $defenseDate,
        string $timeStarted,
        string $timeEnded,
        array $proponentNames,
        ?string $chairmanName,
        array $memberPanelistNames,
        array $commentsByPanelist,
        string $verdict,
        ?string $approvedTitle
    ): string {
        $workingDirectory = storage_path('app/private/tmp/concept-verdict-minutes-'.Str::uuid()->toString());
        File::ensureDirectoryExists($workingDirectory);
        $outputPdfPath = $workingDirectory.'/concept-verdict-minutes.pdf';

        $this->generateFallbackPdf(
            $outputPdfPath,
            $signatureDataUrl,
            $adviserName,
            $signedAt,
            $defenseDate,
            $timeStarted,
            $timeEnded,
            $proponentNames,
            $chairmanName,
            $memberPanelistNames,
            $commentsByPanelist,
            $verdict,
            $approvedTitle,
        );

        return $outputPdfPath;
    }

    /**
     * @param  array<int, string>  $proponentNames
     * @param  array<int, string>  $memberPanelistNames
     * @param  array<int, array{panelist: string, comments: array<int, string>}>  $commentsByPanelist
     */
    private function generateFallbackPdf(
        string $outputPdfPath,
        string $signatureDataUrl,
        string $adviserName,
        CarbonInterface $signedAt,
        string $defenseDate,
        string $timeStarted,
        string $timeEnded,
        array $proponentNames,
        ?string $chairmanName,
        array $memberPanelistNames,
        array $commentsByPanelist,
        string $verdict,
        ?string $approvedTitle
    ): void {
        $pages = [];
        $headerImage = $this->loadTemplateImage(storage_path('app/private/templates/header.png'));
        $footerImage = $this->loadTemplateImage(storage_path('app/private/templates/footer.png'));
        $signatureImage = $this->extractSignatureImage($signatureDataUrl);
        $imageMap = [];

        $headerPlacement = null;
        $titleY = 696;

        if (is_array($headerImage)) {
            $headerSize = $this->calculateImageDrawSize($headerImage, self::PAGE_WIDTH, 140.0);
            $headerY = self::PAGE_HEIGHT - $headerSize['height'];
            $headerPlacement = [
                'key' => 'HEADER',
                'x' => 0.0,
                'y' => $headerY,
                'width' => $headerSize['width'],
                'height' => $headerSize['height'],
            ];
            $imageMap['HEADER'] = $headerImage;
            $titleY = max(684, (int) floor($headerY - 24.0));
        }

        $footerPlacement = null;
        $footerTopEdgeY = 0.0;

        if (is_array($footerImage)) {
            $footerSize = $this->calculateImageDrawSize($footerImage, self::PAGE_WIDTH, 112.0);
            $footerPlacement = [
                'key' => 'FOOTER',
                'x' => 0.0,
                'y' => 0.0,
                'width' => $footerSize['width'],
                'height' => $footerSize['height'],
            ];
            $imageMap['FOOTER'] = $footerImage;
            $footerTopEdgeY = $footerSize['height'];
        }

        $pageIndex = $this->appendNewPage($pages, $headerPlacement, $footerPlacement);

        $dateRowY = $titleY - 30;
        $proponentsLabelY = $dateRowY - 22;
        $proponentRowOneY = $proponentsLabelY - 20;
        $proponentRowTwoY = $proponentsLabelY - 37;
        $panelistsLabelY = $proponentRowTwoY - 30;
        $chairmanRowY = $panelistsLabelY - 18;
        $membersLabelY = $chairmanRowY - 17;
        $memberRowOneY = $membersLabelY - 18;
        $memberRowTwoY = $memberRowOneY - 17;
        $commentsHeadingY = $memberRowTwoY - 28;
        $commentsStartY = $commentsHeadingY - 18;

        $this->appendPdfCenteredTextLine($pages[$pageIndex], 'F2', 14, $titleY, 'MINUTES OF THE OUTLINE DEFENSE');

        $this->appendPdfTextLine($pages[$pageIndex], 'F2', 11, 94, $dateRowY, 'Date:');
        $this->appendPdfTextLine($pages[$pageIndex], 'F2', 11, 215, $dateRowY, 'Time Started:');
        $this->appendPdfTextLine($pages[$pageIndex], 'F2', 11, 385, $dateRowY, 'Time Ended:');
        $this->appendPdfHorizontalLine($pages[$pageIndex], 126.0, 202.0, $dateRowY - 4, 0.8);
        $this->appendPdfHorizontalLine($pages[$pageIndex], 292.0, 360.0, $dateRowY - 4, 0.8);
        $this->appendPdfHorizontalLine($pages[$pageIndex], 451.0, 510.0, $dateRowY - 4, 0.8);
        $this->appendPdfTextLine($pages[$pageIndex], 'F2', 11, 128, $dateRowY, $this->shortenLineText($defenseDate, 20));
        $this->appendPdfTextLine($pages[$pageIndex], 'F2', 11, 294, $dateRowY, $this->shortenLineText($timeStarted, 12));
        $this->appendPdfTextLine($pages[$pageIndex], 'F2', 11, 453, $dateRowY, $this->shortenLineText($timeEnded, 12));

        $this->appendPdfTextLine($pages[$pageIndex], 'F2', 11, 94, $proponentsLabelY, 'Proponents:');
        $this->appendPdfHorizontalLine($pages[$pageIndex], 176.0, 281.0, $proponentRowOneY - 4, 0.9);
        $this->appendPdfHorizontalLine($pages[$pageIndex], 176.0, 281.0, $proponentRowTwoY - 4, 0.9);
        $this->appendPdfHorizontalLine($pages[$pageIndex], 383.0, 488.0, $proponentRowOneY - 4, 0.9);
        $this->appendPdfHorizontalLine($pages[$pageIndex], 383.0, 488.0, $proponentRowTwoY - 4, 0.9);

        $normalizedProponents = collect($proponentNames)
            ->map(fn (string $name): string => trim($name))
            ->filter(fn (string $name): bool => $name !== '')
            ->values()
            ->take(4)
            ->all();

        $proponentRowPositions = [
            ['index' => 0, 'number' => 1, 'numberX' => 128, 'nameX' => 176, 'y' => $proponentRowOneY],
            ['index' => 1, 'number' => 2, 'numberX' => 128, 'nameX' => 176, 'y' => $proponentRowTwoY],
            ['index' => 2, 'number' => 3, 'numberX' => 340, 'nameX' => 383, 'y' => $proponentRowOneY],
            ['index' => 3, 'number' => 4, 'numberX' => 340, 'nameX' => 383, 'y' => $proponentRowTwoY],
        ];

        foreach ($proponentRowPositions as $position) {
            $this->appendPdfTextLine($pages[$pageIndex], 'F1', 11, $position['numberX'], $position['y'], $position['number'].'.');

            $nameIndex = (int) $position['index'];
            $rawName = is_string($normalizedProponents[$nameIndex] ?? null) ? $normalizedProponents[$nameIndex] : '';
            if ($rawName === '') {
                continue;
            }

            $this->appendPdfTextLine(
                $pages[$pageIndex],
                'F2',
                10,
                $position['nameX'],
                $position['y'],
                $this->shortenLineText($rawName, 26)
            );
        }

        $panelNameLineStartX = 198.0;
        $panelNameLineEndX = 384.0;
        $panelNameTextX = 201;
        $signatureLabelX = 398;
        $signatureLineStartX = 458.0;
        $signatureLineEndX = 535.0;

        $this->appendPdfTextLine($pages[$pageIndex], 'F2', 11, 94, $panelistsLabelY, 'Panelists:');
        $this->appendPdfTextLine($pages[$pageIndex], 'F1', 11, 130, $chairmanRowY, 'Chairman:');
        $this->appendPdfTextLine($pages[$pageIndex], 'F1', 11, $signatureLabelX, $chairmanRowY, 'Signature:');
        $this->appendPdfTextLine($pages[$pageIndex], 'F1', 11, 130, $membersLabelY, 'Members:');
        $this->appendPdfTextLine($pages[$pageIndex], 'F1', 11, 155, $memberRowOneY, '1.');
        $this->appendPdfTextLine($pages[$pageIndex], 'F1', 11, 155, $memberRowTwoY, '2.');
        $this->appendPdfTextLine($pages[$pageIndex], 'F1', 11, $signatureLabelX, $memberRowOneY, 'Signature:');
        $this->appendPdfTextLine($pages[$pageIndex], 'F1', 11, $signatureLabelX, $memberRowTwoY, 'Signature:');

        $this->appendPdfHorizontalLine($pages[$pageIndex], $panelNameLineStartX, $panelNameLineEndX, $chairmanRowY - 4, 0.9);
        $this->appendPdfHorizontalLine($pages[$pageIndex], $panelNameLineStartX, $panelNameLineEndX, $memberRowOneY - 4, 0.9);
        $this->appendPdfHorizontalLine($pages[$pageIndex], $panelNameLineStartX, $panelNameLineEndX, $memberRowTwoY - 4, 0.9);
        $this->appendPdfHorizontalLine($pages[$pageIndex], $signatureLineStartX, $signatureLineEndX, $chairmanRowY - 4, 0.9);
        $this->appendPdfHorizontalLine($pages[$pageIndex], $signatureLineStartX, $signatureLineEndX, $memberRowOneY - 4, 0.9);
        $this->appendPdfHorizontalLine($pages[$pageIndex], $signatureLineStartX, $signatureLineEndX, $memberRowTwoY - 4, 0.9);

        $normalizedChairmanName = is_string($chairmanName) ? trim($chairmanName) : '';
        if ($normalizedChairmanName !== '') {
            $this->appendPdfTextLine($pages[$pageIndex], 'F2', 10, $panelNameTextX, $chairmanRowY, $this->shortenLineText($normalizedChairmanName, 24));
        }

        $normalizedMemberNames = collect($memberPanelistNames)
            ->map(fn (string $name): string => trim($name))
            ->filter(fn (string $name): bool => $name !== '')
            ->values()
            ->take(2)
            ->all();

        $memberNameSlots = [
            ['name' => is_string($normalizedMemberNames[0] ?? null) ? $normalizedMemberNames[0] : '', 'y' => $memberRowOneY],
            ['name' => is_string($normalizedMemberNames[1] ?? null) ? $normalizedMemberNames[1] : '', 'y' => $memberRowTwoY],
        ];

        foreach ($memberNameSlots as $memberNameSlot) {
            if ($memberNameSlot['name'] === '') {
                continue;
            }

            $this->appendPdfTextLine(
                $pages[$pageIndex],
                'F2',
                10,
                $panelNameTextX,
                $memberNameSlot['y'],
                $this->shortenLineText($memberNameSlot['name'], 24)
            );
        }

        $this->appendPdfTextLine($pages[$pageIndex], 'F2', 11, 94, $commentsHeadingY, 'COMMENTS');
        $this->appendPdfTextLine($pages[$pageIndex], 'F1', 10, 162, $commentsHeadingY, '(Separate comments per panel)');

        $minimumContentY = max((int) ceil($footerTopEdgeY + 20.0), 84);
        $currentY = $commentsStartY;

        $normalizedCommentGroups = collect($commentsByPanelist)
            ->map(function (array $commentGroup): array {
                $panelistName = trim((string) ($commentGroup['panelist'] ?? ''));
                $panelComments = collect($commentGroup['comments'] ?? [])
                    ->map(fn (string $comment): string => trim($comment))
                    ->filter(fn (string $comment): bool => $comment !== '')
                    ->values()
                    ->all();

                return [
                    'panelist' => $panelistName,
                    'comments' => $panelComments,
                ];
            })
            ->filter(fn (array $commentGroup): bool => $commentGroup['panelist'] !== '' && $commentGroup['comments'] !== [])
            ->values()
            ->all();

        if ($normalizedCommentGroups === []) {
            $this->ensureCursorHasSpace(
                $pages,
                $pageIndex,
                $currentY,
                12,
                $minimumContentY,
                $titleY,
                $headerPlacement,
                $footerPlacement,
                'COMMENTS (continued)'
            );
            $this->appendPdfTextLine($pages[$pageIndex], 'F1', 10, 104, $currentY, 'No adviser or panelist comments recorded.');
            $currentY -= 12;
        } else {
            foreach ($normalizedCommentGroups as $commentGroup) {
                $panelistLabelLines = $this->wrapTextByWidth($commentGroup['panelist'].':', 10, 380.0);

                foreach ($panelistLabelLines as $panelistLabelLine) {
                    $this->ensureCursorHasSpace(
                        $pages,
                        $pageIndex,
                        $currentY,
                        12,
                        $minimumContentY,
                        $titleY,
                        $headerPlacement,
                        $footerPlacement,
                        'COMMENTS (continued)'
                    );
                    $this->appendPdfTextLine($pages[$pageIndex], 'F2', 10, 104, $currentY, $panelistLabelLine);
                    $currentY -= 12;
                }

                foreach ($commentGroup['comments'] as $panelComment) {
                    $wrappedCommentLines = $this->wrapTextByWidth($panelComment, 9, 374.0);

                    if ($wrappedCommentLines === []) {
                        continue;
                    }

                    foreach ($wrappedCommentLines as $lineIndex => $wrappedCommentLine) {
                        $this->ensureCursorHasSpace(
                            $pages,
                            $pageIndex,
                            $currentY,
                            10,
                            $minimumContentY,
                            $titleY,
                            $headerPlacement,
                            $footerPlacement,
                            'COMMENTS (continued)'
                        );

                        $prefix = $lineIndex === 0 ? '- ' : '  ';
                        $this->appendPdfTextLine($pages[$pageIndex], 'F1', 9, 112, $currentY, $prefix.$wrappedCommentLine);
                        $currentY -= 10;
                    }

                    $currentY -= 2;
                }

                $currentY -= 4;
            }
        }

        $currentY -= 36;

        $normalizedVerdict = strtolower(trim($verdict));
        $isPassWithRevisions = in_array($normalizedVerdict, [
            'passed (no revisions needed)',
            'passed (with revisions needed)',
            'pass with revision',
            'conditional pass',
            'conditional passed',
        ], true);
        $isDeferred = $normalizedVerdict === 'deffered';
        $isFailed = $normalizedVerdict === 'failed';

        $verdictNoteHeight = in_array($normalizedVerdict, ['conditional pass', 'conditional passed', 'passed (no revisions needed)'], true) ? 14 : 0;

        $this->ensureCursorHasSpace(
            $pages,
            $pageIndex,
            $currentY,
            22 + $verdictNoteHeight,
            $minimumContentY,
            $titleY,
            $headerPlacement,
            $footerPlacement,
            'VERDICT AND DECISION'
        );

        $verdictRowY = $currentY;
        $this->appendPdfTextLine($pages[$pageIndex], 'F2', 11, 94, $verdictRowY, 'Verdict:');
        $verdictLineText = sprintf(
            '[%s] Passed with Revisions   [%s] Deferred until Re-defense   [%s] Failed',
            $isPassWithRevisions ? '/' : ' ',
            $isDeferred ? '/' : ' ',
            $isFailed ? '/' : ' '
        );

        $this->appendPdfTextLine(
            $pages[$pageIndex],
            'F1',
            11,
            166,
            $verdictRowY,
            $verdictLineText
        );

        if (in_array($normalizedVerdict, ['conditional pass', 'conditional passed'], true)) {
            $this->appendPdfTextLine($pages[$pageIndex], 'F1', 9, 104, $verdictRowY - 14, 'Conditional Passed is recorded under Passed with Revisions.');
            $currentY = $verdictRowY - 24;
        } elseif ($normalizedVerdict === 'passed (no revisions needed)') {
            $this->appendPdfTextLine(
                $pages[$pageIndex],
                'F1',
                9,
                104,
                $verdictRowY - 14,
                'Passed (No revisions needed) is recorded under Passed with Revisions.'
            );
            $currentY = $verdictRowY - 24;
        } else {
            $currentY = $verdictRowY - 16;
        }

        $deferredRequirementLines = [];
        if ($isDeferred) {
            $deferredRequirementLines = $this->wrapTextByWidth(
                'Re-defense with revised outline and new title options is required.',
                9,
                380.0
            );
        }

        $deferredLineCount = max(2, count($deferredRequirementLines));

        $this->ensureCursorHasSpace(
            $pages,
            $pageIndex,
            $currentY,
            24 + ($deferredLineCount * 18),
            $minimumContentY,
            $titleY,
            $headerPlacement,
            $footerPlacement,
            'VERDICT AND DECISION (continued)'
        );

        $deferredHeadingY = $currentY;
        $this->appendPdfTextLine($pages[$pageIndex], 'F1', 11, 94, $deferredHeadingY, 'The following are the requirements for students with Deferred verdicts.');

        $firstDeferredLineY = $deferredHeadingY - 20;
        $lastDeferredLineY = $firstDeferredLineY;

        for ($lineIndex = 0; $lineIndex < $deferredLineCount; $lineIndex++) {
            $lineY = $firstDeferredLineY - ($lineIndex * 18);
            $this->appendPdfHorizontalLine($pages[$pageIndex], 103.0, 491.0, $lineY, 1.1);

            $lineText = is_string($deferredRequirementLines[$lineIndex] ?? null) ? $deferredRequirementLines[$lineIndex] : '';
            if ($lineText !== '') {
                $this->appendPdfTextLine($pages[$pageIndex], 'F1', 9, 108, $lineY + 2, $lineText);
            }

            $lastDeferredLineY = $lineY;
        }

        $currentY = $lastDeferredLineY - 16;

        $normalizedApprovedTitle = is_string($approvedTitle) ? trim($approvedTitle) : '';
        $approvedTitleLines = [];

        if ($isPassWithRevisions && $normalizedApprovedTitle !== '') {
            $approvedTitleLines = $this->wrapTextByWidth($normalizedApprovedTitle, 10, 380.0);
        }

        $approvedTitleLineCount = max(2, count($approvedTitleLines));

        $this->ensureCursorHasSpace(
            $pages,
            $pageIndex,
            $currentY,
            24 + ($approvedTitleLineCount * 18),
            $minimumContentY,
            $titleY,
            $headerPlacement,
            $footerPlacement,
            'APPROVED TITLE'
        );

        $approvedTitleLabelY = $currentY;
        $this->appendPdfTextLine($pages[$pageIndex], 'F2', 11, 94, $approvedTitleLabelY, 'Approved Title:');

        $firstApprovedLineY = $approvedTitleLabelY - 20;
        $lastApprovedLineY = $firstApprovedLineY;

        for ($lineIndex = 0; $lineIndex < $approvedTitleLineCount; $lineIndex++) {
            $lineY = $firstApprovedLineY - ($lineIndex * 18);
            $this->appendPdfHorizontalLine($pages[$pageIndex], 103.0, 491.0, $lineY, 1.1);

            $lineText = is_string($approvedTitleLines[$lineIndex] ?? null) ? $approvedTitleLines[$lineIndex] : '';
            if ($lineText !== '') {
                $this->appendPdfTextLine($pages[$pageIndex], 'F2', 10, 108, $lineY + 2, $lineText);
            }

            $lastApprovedLineY = $lineY;
        }

        $currentY = $lastApprovedLineY - 34;

        $this->ensureCursorHasSpace(
            $pages,
            $pageIndex,
            $currentY,
            84,
            $minimumContentY,
            $titleY,
            $headerPlacement,
            $footerPlacement,
            'Prepared by:'
        );

        $preparedByLabelY = $currentY;
        $nameLineY = $preparedByLabelY - 24;
        $preparedByNameY = $nameLineY - 12;
        $preparedByRoleY = $preparedByNameY - 12;
        $signatureY = $nameLineY + 4.0;
        $signatureBlockCenterX = 160.0;

        $this->appendPdfTextLine($pages[$pageIndex], 'F2', 11, 94, $preparedByLabelY, 'Prepared by:');
        $this->appendPdfHorizontalLine($pages[$pageIndex], 94.0, 209.0, $nameLineY, 1.1);

        if (is_array($signatureImage)) {
            $signatureSize = $this->calculateImageDrawSize($signatureImage, 116.0, 30.0);
            $signatureX = $signatureBlockCenterX - ($signatureSize['width'] / 2.0);
            $this->appendPdfImageCommand($pages[$pageIndex], 'SIG', $signatureX, $signatureY, $signatureSize['width'], $signatureSize['height']);
            $imageMap['SIG'] = $signatureImage;
        }

        $this->appendPdfTextLine($pages[$pageIndex], 'F2', 11, 94, $preparedByNameY, $this->shortenLineText(Str::upper(trim($adviserName)), 24));
        $this->appendPdfTextLine($pages[$pageIndex], 'F1', 11, 94, $preparedByRoleY, 'Adviser');

        $pageStreams = collect($pages)
            ->map(fn (array $pageLines): string => implode("\n", $pageLines))
            ->values()
            ->all();

        $pdfDocument = $this->buildSimplePdfDocument($pageStreams, $imageMap);
        File::put($outputPdfPath, $pdfDocument);
    }

    /**
     * @param  array<int, array<int, string>>  $pages
     * @param  array{key: string, x: float, y: float, width: float, height: float}|null  $headerPlacement
     * @param  array{key: string, x: float, y: float, width: float, height: float}|null  $footerPlacement
     */
    private function appendNewPage(array &$pages, ?array $headerPlacement, ?array $footerPlacement): int
    {
        $lines = [];

        if (is_array($headerPlacement)) {
            $this->appendPdfImageCommand(
                $lines,
                $headerPlacement['key'],
                $headerPlacement['x'],
                $headerPlacement['y'],
                $headerPlacement['width'],
                $headerPlacement['height']
            );
        }

        if (is_array($footerPlacement)) {
            $this->appendPdfImageCommand(
                $lines,
                $footerPlacement['key'],
                $footerPlacement['x'],
                $footerPlacement['y'],
                $footerPlacement['width'],
                $footerPlacement['height']
            );
        }

        $pages[] = $lines;

        return count($pages) - 1;
    }

    /**
     * @param  array<int, array<int, string>>  $pages
     * @param  array{key: string, x: float, y: float, width: float, height: float}|null  $headerPlacement
     * @param  array{key: string, x: float, y: float, width: float, height: float}|null  $footerPlacement
     */
    private function ensureCursorHasSpace(
        array &$pages,
        int &$pageIndex,
        int &$cursorY,
        int $requiredHeight,
        int $minimumY,
        int $titleY,
        ?array $headerPlacement,
        ?array $footerPlacement,
        ?string $sectionHeading = null
    ): void {
        if (($cursorY - $requiredHeight) >= $minimumY) {
            return;
        }

        $pageIndex = $this->appendNewPage($pages, $headerPlacement, $footerPlacement);

        if ($sectionHeading === null || trim($sectionHeading) === '') {
            $cursorY = $titleY - 24;

            return;
        }

        $headingY = $titleY - 24;
        $this->appendPdfTextLine($pages[$pageIndex], 'F2', 11, 94, $headingY, $sectionHeading);
        $cursorY = $headingY - 18;
    }

    private function appendPdfTextLine(array &$lines, string $fontKey, int $fontSize, int $x, int $y, string $text): void
    {
        $safeText = $this->escapePdfText($text);
        $lines[] = "BT /{$fontKey} {$fontSize} Tf {$x} {$y} Td ({$safeText}) Tj ET";
    }

    private function appendPdfCenteredTextLine(array &$lines, string $fontKey, int $fontSize, int $y, string $text): void
    {
        $x = (self::PAGE_WIDTH - $this->estimatePdfTextWidth($text, $fontSize)) / 2.0;
        $this->appendPdfTextLine($lines, $fontKey, $fontSize, (int) round(max(24.0, $x)), $y, $text);
    }

    private function appendPdfImageCommand(array &$lines, string $imageKey, float $x, float $y, float $width, float $height): void
    {
        $lines[] = 'q';
        $lines[] = sprintf(
            '%s 0 0 %s %s %s cm',
            $this->formatPdfNumber($width),
            $this->formatPdfNumber($height),
            $this->formatPdfNumber($x),
            $this->formatPdfNumber($y),
        );
        $lines[] = '/'.$imageKey.' Do';
        $lines[] = 'Q';
    }

    private function appendPdfHorizontalLine(array &$lines, float $startX, float $endX, float $y, float $lineWidth = 1.0): void
    {
        $lines[] = 'q';
        $lines[] = sprintf('%s w', $this->formatPdfNumber($lineWidth));
        $lines[] = sprintf(
            '%s %s m %s %s l S',
            $this->formatPdfNumber($startX),
            $this->formatPdfNumber($y),
            $this->formatPdfNumber($endX),
            $this->formatPdfNumber($y),
        );
        $lines[] = 'Q';
    }

    private function formatPdfNumber(float $value): string
    {
        $normalized = number_format($value, 3, '.', '');

        return rtrim(rtrim($normalized, '0'), '.');
    }

    private function escapePdfText(string $text): string
    {
        $collapsed = trim(preg_replace('/\s+/', ' ', $text) ?? '');
        if ($collapsed === '') {
            return '';
        }

        if (function_exists('iconv')) {
            $converted = iconv('UTF-8', 'windows-1252//TRANSLIT//IGNORE', $collapsed);
            if (is_string($converted) && $converted !== '') {
                $collapsed = $converted;
            }
        }

        return str_replace(
            ['\\', '(', ')', "\n", "\r", "\t"],
            ['\\\\', '\\(', '\\)', '', '', ' '],
            $collapsed
        );
    }

    private function estimatePdfTextWidth(string $text, int $fontSize): float
    {
        $collapsed = trim(preg_replace('/\s+/', ' ', $text) ?? '');
        if ($collapsed === '') {
            return 0.0;
        }

        return strlen($collapsed) * ($fontSize * 0.52);
    }

    private function estimatePdfSpaceWidth(int $fontSize): float
    {
        return $fontSize * 0.34;
    }

    /**
     * @return array<int, string>
     */
    private function wrapTextByWidth(string $value, int $fontSize, float $maxWidth): array
    {
        $normalized = trim(preg_replace('/\s+/', ' ', $value) ?? '');
        if ($normalized === '') {
            return [];
        }

        $words = preg_split('/\s+/', $normalized) ?: [];
        $lines = [];
        $currentLine = '';

        foreach ($words as $word) {
            $normalizedWord = trim((string) $word);
            if ($normalizedWord === '') {
                continue;
            }

            $candidateLine = $currentLine === '' ? $normalizedWord : $currentLine.' '.$normalizedWord;
            if ($this->estimatePdfTextWidth($candidateLine, $fontSize) <= $maxWidth) {
                $currentLine = $candidateLine;

                continue;
            }

            if ($currentLine !== '') {
                $lines[] = $currentLine;
                $currentLine = '';
            }

            if ($this->estimatePdfTextWidth($normalizedWord, $fontSize) <= $maxWidth) {
                $currentLine = $normalizedWord;

                continue;
            }

            $remainingWord = $normalizedWord;
            while ($remainingWord !== '') {
                $chunk = '';
                $remainingLength = strlen($remainingWord);

                for ($index = 1; $index <= $remainingLength; $index++) {
                    $candidateChunk = substr($remainingWord, 0, $index);
                    if ($this->estimatePdfTextWidth($candidateChunk, $fontSize) > $maxWidth) {
                        break;
                    }

                    $chunk = $candidateChunk;
                }

                if ($chunk === '') {
                    $chunk = substr($remainingWord, 0, 1);
                }

                $lines[] = $chunk;
                $remainingWord = substr($remainingWord, strlen($chunk));
            }
        }

        if ($currentLine !== '') {
            $lines[] = $currentLine;
        }

        return $lines;
    }

    private function shortenLineText(string $value, int $maxCharacters): string
    {
        $normalized = trim(preg_replace('/\s+/', ' ', $value) ?? '');
        if ($normalized === '') {
            return '';
        }

        return Str::limit($normalized, $maxCharacters, '...');
    }

    /**
     * @param  array{width: int, height: int}  $image
     * @return array{width: float, height: float}
     */
    private function calculateImageDrawSize(
        array $image,
        float $maxWidth,
        float $maxHeight,
        float $minimumWidth = 24.0,
        float $minimumHeight = 12.0
    ): array {
        $sourceWidth = max(1.0, (float) $image['width']);
        $sourceHeight = max(1.0, (float) $image['height']);
        $scale = min($maxWidth / $sourceWidth, $maxHeight / $sourceHeight);
        $drawWidth = max($minimumWidth, $sourceWidth * $scale);
        $drawHeight = max($minimumHeight, $sourceHeight * $scale);

        return [
            'width' => $drawWidth,
            'height' => $drawHeight,
        ];
    }

    /**
     * @return array{width: int, height: int, rgb_data: string, alpha_data: string|null}|null
     */
    private function loadTemplateImage(string $imagePath): ?array
    {
        if (! is_file($imagePath)) {
            return null;
        }

        try {
            return $this->parsePngImage((string) File::get($imagePath));
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * @param  array<int, string>  $pageStreams
     * @param  array<string, array{width: int, height: int, rgb_data: string, alpha_data: string|null}>  $images
     */
    private function buildSimplePdfDocument(array $pageStreams, array $images = []): string
    {
        if ($pageStreams === []) {
            throw new RuntimeException('No content was generated for the concept verdict minutes PDF.');
        }

        $pageResources = '<< /ProcSet [/PDF /Text /ImageC] /Font << /F1 3 0 R /F2 4 0 R >>';
        $xObjectEntries = [];

        $objects = [
            1 => '<< /Type /Catalog /Pages 2 0 R >>',
            2 => '<< /Type /Pages /Kids [] /Count 0 >>',
            3 => '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
            4 => '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
        ];

        $nextObjectId = 5;
        $pageObjectIds = [];
        $contentObjectIds = [];

        foreach ($pageStreams as $pageStream) {
            $contentObjectId = $nextObjectId;
            $nextObjectId++;
            $pageObjectId = $nextObjectId;
            $nextObjectId++;

            $objects[$contentObjectId] = '<< /Length '.strlen($pageStream)." >>\nstream\n{$pageStream}\nendstream";
            $contentObjectIds[] = $contentObjectId;
            $pageObjectIds[] = $pageObjectId;
        }

        foreach ($images as $imageKey => $image) {
            $rgbCompressed = gzcompress((string) $image['rgb_data'], 9);
            $alphaCompressed = $image['alpha_data'] !== null
                ? gzcompress((string) $image['alpha_data'], 9)
                : null;

            $imageObjectId = $nextObjectId;
            $nextObjectId++;
            $smaskObjectId = null;

            if ($alphaCompressed !== null) {
                $smaskObjectId = $nextObjectId;
                $nextObjectId++;
            }

            $imageDictionary = '<< /Type /XObject /Subtype /Image /Width '.(int) $image['width'].
                ' /Height '.(int) $image['height'].
                ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode';

            if ($smaskObjectId !== null) {
                $imageDictionary .= ' /SMask '.$smaskObjectId.' 0 R';
            }

            $imageDictionary .= ' /Length '.strlen((string) $rgbCompressed).' >>';
            $objects[$imageObjectId] = $imageDictionary."\nstream\n".$rgbCompressed."\nendstream";

            if ($smaskObjectId !== null && $alphaCompressed !== null) {
                $objects[$smaskObjectId] = '<< /Type /XObject /Subtype /Image /Width '.(int) $image['width'].
                    ' /Height '.(int) $image['height'].
                    ' /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length '.strlen((string) $alphaCompressed).
                    " >>\nstream\n".$alphaCompressed."\nendstream";
            }

            $xObjectEntries[] = '/'.$imageKey.' '.$imageObjectId.' 0 R';
        }

        if ($xObjectEntries !== []) {
            $pageResources .= ' /XObject << '.implode(' ', $xObjectEntries).' >>';
        }

        $pageResources .= ' >>';

        foreach ($pageObjectIds as $index => $pageObjectId) {
            $contentObjectId = $contentObjectIds[$index] ?? null;
            if (! is_int($contentObjectId)) {
                continue;
            }

            $objects[$pageObjectId] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '.self::PAGE_WIDTH.' '.self::PAGE_HEIGHT.
                '] /Resources '.$pageResources.' /Contents '.$contentObjectId.' 0 R >>';
        }

        $pageKids = collect($pageObjectIds)
            ->map(fn (int $pageObjectId): string => $pageObjectId.' 0 R')
            ->implode(' ');

        $objects[2] = '<< /Type /Pages /Kids ['.$pageKids.'] /Count '.count($pageObjectIds).' >>';

        ksort($objects);

        $output = "%PDF-1.4\n";
        $offsets = [0];

        foreach ($objects as $index => $objectBody) {
            $offsets[$index] = strlen($output);
            $output .= "{$index} 0 obj\n{$objectBody}\nendobj\n";
        }

        $startXref = strlen($output);
        $maxObjectId = max(array_keys($objects));

        $output .= 'xref'."\n";
        $output .= '0 '.($maxObjectId + 1)."\n";
        $output .= "0000000000 65535 f \n";

        for ($objectId = 1; $objectId <= $maxObjectId; $objectId++) {
            $offset = $offsets[$objectId] ?? 0;
            $output .= sprintf('%010d 00000 n ', $offset)."\n";
        }

        $output .= 'trailer'."\n";
        $output .= '<< /Size '.($maxObjectId + 1).' /Root 1 0 R >>'."\n";
        $output .= 'startxref'."\n";
        $output .= $startXref."\n";
        $output .= '%%EOF';

        return $output;
    }

    /**
     * @return array{width: int, height: int, rgb_data: string, alpha_data: string|null}
     */
    private function extractSignatureImage(string $signatureDataUrl): array
    {
        return $this->parsePngImage($this->decodeSignaturePngData($signatureDataUrl));
    }

    private function decodeSignaturePngData(string $signatureDataUrl): string
    {
        if (! str_starts_with($signatureDataUrl, 'data:image/png;base64,')) {
            throw new RuntimeException('Only PNG signature data is supported.');
        }

        $base64 = substr($signatureDataUrl, strlen('data:image/png;base64,'));
        $decoded = base64_decode($base64, true);

        if (! is_string($decoded) || $decoded === '') {
            throw new RuntimeException('Unable to decode adviser e-signature.');
        }

        return $decoded;
    }

    /**
     * @return array{width: int, height: int, rgb_data: string, alpha_data: string|null}
     */
    private function parsePngImage(string $pngData): array
    {
        if (substr($pngData, 0, 8) !== "\x89PNG\x0D\x0A\x1A\x0A") {
            throw new RuntimeException('Unsupported signature PNG format.');
        }

        $offset = 8;
        $width = null;
        $height = null;
        $bitDepth = null;
        $colorType = null;
        $compressionMethod = null;
        $filterMethod = null;
        $interlaceMethod = null;
        $idatData = '';

        while ($offset + 8 <= strlen($pngData)) {
            $length = unpack('N', substr($pngData, $offset, 4));
            if (! is_array($length) || ! isset($length[1])) {
                break;
            }

            $chunkLength = (int) $length[1];
            $offset += 4;
            $chunkType = substr($pngData, $offset, 4);
            $offset += 4;
            $chunkData = substr($pngData, $offset, $chunkLength);
            $offset += $chunkLength + 4;

            if ($chunkType === 'IHDR') {
                $ihdr = unpack('Nwidth/Nheight/Cbit/Ccolor/Ccompression/Cfilter/Cinterlace', $chunkData);
                if (! is_array($ihdr)) {
                    throw new RuntimeException('Invalid signature PNG header.');
                }

                $width = (int) ($ihdr['width'] ?? 0);
                $height = (int) ($ihdr['height'] ?? 0);
                $bitDepth = (int) ($ihdr['bit'] ?? 0);
                $colorType = (int) ($ihdr['color'] ?? 0);
                $compressionMethod = (int) ($ihdr['compression'] ?? 0);
                $filterMethod = (int) ($ihdr['filter'] ?? 0);
                $interlaceMethod = (int) ($ihdr['interlace'] ?? 0);

                continue;
            }

            if ($chunkType === 'IDAT') {
                $idatData .= $chunkData;

                continue;
            }

            if ($chunkType === 'IEND') {
                break;
            }
        }

        if ($width === null || $height === null || $bitDepth === null || $colorType === null) {
            throw new RuntimeException('Signature PNG metadata is incomplete.');
        }

        if ($width <= 0 || $height <= 0) {
            throw new RuntimeException('Signature PNG dimensions are invalid.');
        }

        if ($bitDepth !== 8 || $compressionMethod !== 0 || $filterMethod !== 0 || $interlaceMethod !== 0) {
            throw new RuntimeException('Signature PNG uses unsupported encoding.');
        }

        $bytesPerPixel = match ($colorType) {
            0 => 1,
            2 => 3,
            4 => 2,
            6 => 4,
            default => throw new RuntimeException('Signature PNG color profile is unsupported.'),
        };

        $inflated = zlib_decode($idatData);
        if (! is_string($inflated)) {
            throw new RuntimeException('Unable to read signature PNG image data.');
        }

        $bytesPerLine = $width * $bytesPerPixel;
        $expectedLength = ($bytesPerLine + 1) * $height;

        if (strlen($inflated) < $expectedLength) {
            throw new RuntimeException('Signature PNG image data is corrupted.');
        }

        $rgbData = '';
        $alphaData = '';
        $hasAlpha = in_array($colorType, [4, 6], true);
        $pointer = 0;
        $previousLine = str_repeat("\x00", $bytesPerLine);

        for ($row = 0; $row < $height; $row++) {
            $filterType = ord($inflated[$pointer]);
            $pointer++;
            $lineData = substr($inflated, $pointer, $bytesPerLine);
            $pointer += $bytesPerLine;
            $decodedLine = '';

            for ($index = 0; $index < $bytesPerLine; $index++) {
                $raw = ord($lineData[$index]);
                $left = $index >= $bytesPerPixel ? ord($decodedLine[$index - $bytesPerPixel]) : 0;
                $up = ord($previousLine[$index]);
                $upLeft = $index >= $bytesPerPixel ? ord($previousLine[$index - $bytesPerPixel]) : 0;

                $value = match ($filterType) {
                    0 => $raw,
                    1 => ($raw + $left) & 0xFF,
                    2 => ($raw + $up) & 0xFF,
                    3 => ($raw + intdiv($left + $up, 2)) & 0xFF,
                    4 => ($raw + $this->paethPredictor($left, $up, $upLeft)) & 0xFF,
                    default => throw new RuntimeException('Signature PNG filter method is unsupported.'),
                };

                $decodedLine .= chr($value);
            }

            for ($index = 0; $index < $bytesPerLine; $index += $bytesPerPixel) {
                if ($colorType === 6) {
                    $rgbData .= $decodedLine[$index].$decodedLine[$index + 1].$decodedLine[$index + 2];
                    $alphaData .= $decodedLine[$index + 3];

                    continue;
                }

                if ($colorType === 4) {
                    $gray = $decodedLine[$index];
                    $rgbData .= $gray.$gray.$gray;
                    $alphaData .= $decodedLine[$index + 1];

                    continue;
                }

                if ($colorType === 2) {
                    $rgbData .= $decodedLine[$index].$decodedLine[$index + 1].$decodedLine[$index + 2];

                    continue;
                }

                $gray = $decodedLine[$index];
                $rgbData .= $gray.$gray.$gray;
            }

            $previousLine = $decodedLine;
        }

        return [
            'width' => $width,
            'height' => $height,
            'rgb_data' => $rgbData,
            'alpha_data' => $hasAlpha ? $alphaData : null,
        ];
    }

    private function paethPredictor(int $left, int $up, int $upLeft): int
    {
        $predictor = $left + $up - $upLeft;
        $leftDistance = abs($predictor - $left);
        $upDistance = abs($predictor - $up);
        $upLeftDistance = abs($predictor - $upLeft);

        if ($leftDistance <= $upDistance && $leftDistance <= $upLeftDistance) {
            return $left;
        }

        if ($upDistance <= $upLeftDistance) {
            return $up;
        }

        return $upLeft;
    }
}
