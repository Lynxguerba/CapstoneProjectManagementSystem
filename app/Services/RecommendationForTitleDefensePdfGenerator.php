<?php

namespace App\Services;

use Carbon\CarbonInterface;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;
use Throwable;

class RecommendationForTitleDefensePdfGenerator
{
    /**
     * @param  array<int, string>  $approvedTitles
     */
    public function generate(
        string $templatePdfPath,
        string $signatureDataUrl,
        array $approvedTitles,
        string $submittedByNames,
        string $adviserName,
        CarbonInterface $signedAt,
        ?string $programCode = null
    ): string {
        $workingDirectory = storage_path('app/private/tmp/recommendation-'.Str::uuid()->toString());
        File::ensureDirectoryExists($workingDirectory);
        $outputPdfPath = $workingDirectory.'/recommendation-title-defense.pdf';

        $this->generateFallbackPdf(
            $outputPdfPath,
            $signatureDataUrl,
            $approvedTitles,
            $submittedByNames,
            $adviserName,
            $signedAt,
            $programCode,
        );

        return $outputPdfPath;
    }

    /**
     * @param  array<int, string>  $proponentNames
     * @param  array<int, string>  $memberPanelistNames
     * @param  array<int, array{panelist: string, comments: array<int, string>}>  $commentsByPanelist
     */
    public function generateAdviserConceptVerdictMinutes(
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

        $this->generateAdviserConceptVerdictMinutesFallbackPdf(
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
    private function generateAdviserConceptVerdictMinutesFallbackPdf(
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
        $lines = [];
        $headerImage = $this->loadTemplateImage(storage_path('app/private/templates/header.png'));
        $footerImage = $this->loadTemplateImage(storage_path('app/private/templates/footer.png'));
        $signatureImage = $this->extractSignatureImage($signatureDataUrl);
        $imageMap = [];

        $titleY = 696;
        if (is_array($headerImage)) {
            $headerSize = $this->calculateImageDrawSize($headerImage, 595.0, 140.0);
            $headerY = 842.0 - $headerSize['height'];
            $this->appendPdfImageCommand($lines, 'HEADER', 0.0, $headerY, $headerSize['width'], $headerSize['height']);
            $imageMap['HEADER'] = $headerImage;
            $titleY = max(684, (int) floor($headerY - 24.0));
        }

        $footerTopEdgeY = 0.0;
        if (is_array($footerImage)) {
            $footerSize = $this->calculateImageDrawSize($footerImage, 595.0, 112.0);
            $this->appendPdfImageCommand($lines, 'FOOTER', 0.0, 0.0, $footerSize['width'], $footerSize['height']);
            $imageMap['FOOTER'] = $footerImage;
            $footerTopEdgeY = $footerSize['height'];
        }

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
        $verdictRowY = 360;
        $deferredHeadingY = 332;
        $deferredFirstLineY = 304;
        $deferredSecondLineY = 286;
        $approvedTitleLabelY = 266;
        $approvedTitleFirstLineY = 243;
        $approvedTitleSecondLineY = 227;
        $preparedByLabelY = max(160, (int) ceil($footerTopEdgeY + 62.0));
        $preparedByNameY = max(118, (int) ceil($footerTopEdgeY + 20.0));
        $preparedByRoleY = $preparedByNameY - 16;
        $signatureY = $preparedByNameY + 18.0;
        $signatureBlockCenterX = 148.0;

        $this->appendPdfCenteredTextLine($lines, 'F2', 14, $titleY, 'MINUTES OF THE OUTLINE DEFENSE');

        $this->appendPdfTextLine($lines, 'F2', 11, 94, $dateRowY, 'Date:');
        $this->appendPdfTextLine($lines, 'F2', 11, 215, $dateRowY, 'Time Started:');
        $this->appendPdfTextLine($lines, 'F2', 11, 385, $dateRowY, 'Time Ended:');
        $this->appendPdfHorizontalLine($lines, 126.0, 202.0, $dateRowY - 4, 0.8);
        $this->appendPdfHorizontalLine($lines, 292.0, 360.0, $dateRowY - 4, 0.8);
        $this->appendPdfHorizontalLine($lines, 451.0, 510.0, $dateRowY - 4, 0.8);
        $this->appendPdfTextLine($lines, 'F2', 11, 128, $dateRowY, $this->shortenLineText($defenseDate, 20));
        $this->appendPdfTextLine($lines, 'F2', 11, 294, $dateRowY, $this->shortenLineText($timeStarted, 12));
        $this->appendPdfTextLine($lines, 'F2', 11, 453, $dateRowY, $this->shortenLineText($timeEnded, 12));

        $this->appendPdfTextLine($lines, 'F2', 11, 94, $proponentsLabelY, 'Proponents:');
        $this->appendPdfHorizontalLine($lines, 176.0, 281.0, $proponentRowOneY - 4, 0.9);
        $this->appendPdfHorizontalLine($lines, 176.0, 281.0, $proponentRowTwoY - 4, 0.9);
        $this->appendPdfHorizontalLine($lines, 383.0, 488.0, $proponentRowOneY - 4, 0.9);
        $this->appendPdfHorizontalLine($lines, 383.0, 488.0, $proponentRowTwoY - 4, 0.9);

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
            $this->appendPdfTextLine($lines, 'F1', 11, $position['numberX'], $position['y'], $position['number'].'.');

            $nameIndex = (int) $position['index'];
            $rawName = is_string($normalizedProponents[$nameIndex] ?? null) ? $normalizedProponents[$nameIndex] : '';
            if ($rawName === '') {
                continue;
            }

            $this->appendPdfTextLine(
                $lines,
                'F2',
                10,
                $position['nameX'],
                $position['y'],
                $this->shortenLineText($rawName, 26)
            );
        }

        $this->appendPdfTextLine($lines, 'F2', 11, 94, $panelistsLabelY, 'Panelists:');
        $this->appendPdfTextLine($lines, 'F1', 11, 130, $chairmanRowY, 'Chairman:');
        $this->appendPdfTextLine($lines, 'F1', 11, 463, $chairmanRowY, 'Signature:');
        $this->appendPdfTextLine($lines, 'F1', 11, 130, $membersLabelY, 'Members:');
        $this->appendPdfTextLine($lines, 'F1', 11, 173, $memberRowOneY, '1.');
        $this->appendPdfTextLine($lines, 'F1', 11, 173, $memberRowTwoY, '2.');
        $this->appendPdfTextLine($lines, 'F1', 11, 463, $memberRowOneY, 'Signature:');
        $this->appendPdfTextLine($lines, 'F1', 11, 463, $memberRowTwoY, 'Signature:');
        $this->appendPdfHorizontalLine($lines, 259.0, 433.0, $chairmanRowY - 4, 0.9);
        $this->appendPdfHorizontalLine($lines, 259.0, 433.0, $memberRowOneY - 4, 0.9);
        $this->appendPdfHorizontalLine($lines, 259.0, 433.0, $memberRowTwoY - 4, 0.9);

        $normalizedChairmanName = is_string($chairmanName) ? trim($chairmanName) : '';
        if ($normalizedChairmanName !== '') {
            $this->appendPdfTextLine($lines, 'F2', 10, 262, $chairmanRowY, $this->shortenLineText($normalizedChairmanName, 30));
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
                $lines,
                'F2',
                10,
                262,
                $memberNameSlot['y'],
                $this->shortenLineText($memberNameSlot['name'], 30)
            );
        }

        $this->appendPdfTextLine($lines, 'F2', 11, 94, $commentsHeadingY, 'COMMENTS');
        $this->appendPdfTextLine($lines, 'F1', 10, 162, $commentsHeadingY, '(Separate comments per panel)');

        $currentCommentY = $commentsStartY;
        $minimumCommentY = $verdictRowY + 24;
        $hasCommentRows = false;
        $commentsTruncated = false;

        foreach ($commentsByPanelist as $commentGroup) {
            if ($currentCommentY <= $minimumCommentY) {
                $commentsTruncated = true;
                break;
            }

            $panelistName = trim((string) ($commentGroup['panelist'] ?? ''));
            $panelComments = collect($commentGroup['comments'] ?? [])
                ->map(fn (string $comment): string => trim($comment))
                ->filter(fn (string $comment): bool => $comment !== '')
                ->values()
                ->all();

            if ($panelistName === '' || $panelComments === []) {
                continue;
            }

            $hasCommentRows = true;
            $this->appendPdfTextLine($lines, 'F2', 10, 104, $currentCommentY, $this->shortenLineText($panelistName.':', 72));
            $currentCommentY -= 12;

            foreach ($panelComments as $panelComment) {
                $wrappedCommentLines = $this->wrapText($panelComment, 84);
                foreach ($wrappedCommentLines as $lineIndex => $wrappedCommentLine) {
                    if ($currentCommentY <= $minimumCommentY) {
                        $commentsTruncated = true;
                        break 3;
                    }

                    $prefix = $lineIndex === 0 ? '- ' : '  ';
                    $this->appendPdfTextLine($lines, 'F1', 9, 112, $currentCommentY, $prefix.$wrappedCommentLine);
                    $currentCommentY -= 10;
                }
            }

            $currentCommentY -= 4;
        }

        if (! $hasCommentRows) {
            $this->appendPdfTextLine($lines, 'F1', 10, 104, $commentsStartY, 'No adviser or panelist comments recorded.');
        } elseif ($commentsTruncated) {
            $this->appendPdfTextLine($lines, 'F1', 9, 104, max($minimumCommentY + 6, 388), 'Additional comments were omitted due to page space.');
        }

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

        $this->appendPdfTextLine($lines, 'F2', 11, 94, $verdictRowY, 'Verdict:');
        $this->appendPdfTextLine(
            $lines,
            'F1',
            11,
            166,
            $verdictRowY,
            sprintf(
                '[%s] Passed with Revisions   [%s] Deferred until %s   [%s] Failed',
                $isPassWithRevisions ? 'x' : ' ',
                $isDeferred ? 'x' : ' ',
                $isDeferred ? 'Re-defense' : '__________',
                $isFailed ? 'x' : ' '
            )
        );

        if (in_array($normalizedVerdict, ['conditional pass', 'conditional passed'], true)) {
            $this->appendPdfTextLine($lines, 'F1', 9, 104, $verdictRowY - 14, 'Conditional Passed is recorded under Passed with Revisions.');
        } elseif ($normalizedVerdict === 'passed (no revisions needed)') {
            $this->appendPdfTextLine(
                $lines,
                'F1',
                9,
                104,
                $verdictRowY - 14,
                'Passed (No revisions needed) is recorded under Passed with Revisions.'
            );
        }

        $this->appendPdfTextLine($lines, 'F1', 11, 94, $deferredHeadingY, 'The following are the requirements for students with Deferred verdicts.');
        $this->appendPdfHorizontalLine($lines, 103.0, 491.0, $deferredFirstLineY, 3.0);
        $this->appendPdfHorizontalLine($lines, 103.0, 491.0, $deferredSecondLineY, 3.0);

        if ($isDeferred) {
            $deferredRequirement = 'Re-defense with revised outline and new title options is required.';
            $this->appendPdfTextLine($lines, 'F1', 9, 108, $deferredFirstLineY + 10, $this->shortenLineText($deferredRequirement, 86));
        }

        $this->appendPdfTextLine($lines, 'F2', 11, 94, $approvedTitleLabelY, 'Approved Title:');
        $this->appendPdfHorizontalLine($lines, 103.0, 491.0, $approvedTitleFirstLineY, 3.0);
        $this->appendPdfHorizontalLine($lines, 103.0, 491.0, $approvedTitleSecondLineY, 3.0);

        $normalizedApprovedTitle = is_string($approvedTitle) ? trim($approvedTitle) : '';
        if ($isPassWithRevisions && $normalizedApprovedTitle !== '') {
            $approvedTitleLines = $this->wrapText($normalizedApprovedTitle, 86);
            $this->appendPdfTextLine($lines, 'F2', 10, 108, $approvedTitleFirstLineY + 2, $approvedTitleLines[0] ?? '');

            if (is_string($approvedTitleLines[1] ?? null)) {
                $this->appendPdfTextLine($lines, 'F2', 10, 108, $approvedTitleSecondLineY + 2, $approvedTitleLines[1]);
            }
        }

        $this->appendPdfTextLine($lines, 'F2', 11, 94, $preparedByLabelY, 'Prepared by:');
        $this->appendPdfHorizontalLine($lines, 103.0, 193.0, $preparedByNameY + 15, 4.5);

        if (is_array($signatureImage)) {
            $signatureSize = $this->calculateImageDrawSize($signatureImage, 120.0, 34.0);
            $signatureX = $signatureBlockCenterX - ($signatureSize['width'] / 2.0);
            $this->appendPdfImageCommand($lines, 'SIG', $signatureX, $signatureY, $signatureSize['width'], $signatureSize['height']);
            $imageMap['SIG'] = $signatureImage;
        }

        $this->appendPdfTextLine($lines, 'F2', 11, 103, $preparedByNameY, $this->shortenLineText(Str::upper(trim($adviserName)), 24));
        $this->appendPdfTextLine($lines, 'F1', 11, 103, $preparedByRoleY, 'Adviser');
        $this->appendPdfRightAlignedTextLine(
            $lines,
            'F1',
            9,
            492.0,
            max((int) ceil($footerTopEdgeY + 10.0), 86),
            'Generated: '.$signedAt->format('M d, Y h:i A')
        );

        $pdfContent = implode("\n", $lines);
        $pdfDocument = $this->buildSimplePdfDocument($pdfContent, $imageMap);
        File::put($outputPdfPath, $pdfDocument);
    }

    /**
     * @param  array<int, string>  $approvedTitles
     */
    private function generateFromTemplate(
        string $templatePdfPath,
        string $signatureDataUrl,
        array $approvedTitles,
        string $submittedByNames,
        string $adviserName,
        CarbonInterface $signedAt,
        string $workingDirectory
    ): string {
        $templatePngPath = $workingDirectory.'/template.png';
        $signaturePngPath = $workingDirectory.'/signature.png';
        $headerPngPath = $workingDirectory.'/header.png';
        $footerPngPath = $workingDirectory.'/footer.png';
        $composedPngPath = $workingDirectory.'/composed.png';
        $outputPdfPath = $workingDirectory.'/recommendation-title-defense.pdf';

        $this->runProcess([
            'gs',
            '-dNOPAUSE',
            '-dBATCH',
            '-sDEVICE=pngalpha',
            '-r180',
            '-dFirstPage=1',
            '-dLastPage=1',
            '-sOutputFile='.$templatePngPath,
            $templatePdfPath,
        ], $workingDirectory);

        $this->writeSignaturePng($signatureDataUrl, $signaturePngPath);

        $magickAnnotateCommand = [
            'magick',
            $templatePngPath,
            '-fill',
            '#111827',
            '-pointsize',
            '52',
            '-gravity',
            'north',
            '-annotate',
            '+0+250',
            'RECOMMENDATION FOR TITLE DEFENSE',
            '-gravity',
            'northwest',
            '-pointsize',
            '22',
        ];

        foreach ($this->buildTitleLines($approvedTitles) as $index => $titleLine) {
            $magickAnnotateCommand[] = '-annotate';
            $magickAnnotateCommand[] = '+170+'.(725 + ($index * 52));
            $magickAnnotateCommand[] = $titleLine;
        }

        $submittedLine = sprintf(
            'has been prepared and submitted by %s and are recommended for title defense.',
            $submittedByNames
        );

        foreach ($this->wrapText($submittedLine, 94) as $index => $line) {
            $magickAnnotateCommand[] = '-annotate';
            $magickAnnotateCommand[] = '+170+'.(1005 + ($index * 34));
            $magickAnnotateCommand[] = $line;
        }

        $magickAnnotateCommand[] = '-pointsize';
        $magickAnnotateCommand[] = '22';
        $magickAnnotateCommand[] = '-annotate';
        $magickAnnotateCommand[] = '+960+1465';
        $magickAnnotateCommand[] = 'Digitally signed by:';
        $magickAnnotateCommand[] = '-pointsize';
        $magickAnnotateCommand[] = '26';
        $magickAnnotateCommand[] = '-annotate';
        $magickAnnotateCommand[] = '+960+1520';
        $magickAnnotateCommand[] = $adviserName;
        $magickAnnotateCommand[] = '-pointsize';
        $magickAnnotateCommand[] = '22';
        $magickAnnotateCommand[] = '-annotate';
        $magickAnnotateCommand[] = '+940+1680';
        $magickAnnotateCommand[] = 'Date Signed: '.$signedAt->format('F d, Y');
        $magickAnnotateCommand[] = '-pointsize';
        $magickAnnotateCommand[] = '18';
        $magickAnnotateCommand[] = '-annotate';
        $magickAnnotateCommand[] = '+940+1730';
        $magickAnnotateCommand[] = 'Registered e-signature: Verified';
        $magickAnnotateCommand[] = $composedPngPath;

        $this->runProcess($magickAnnotateCommand, $workingDirectory);

        $headerAssetPath = storage_path('app/private/templates/header.png');
        if (is_file($headerAssetPath)) {
            $this->runProcess([
                'magick',
                $headerAssetPath,
                '-fuzz',
                '6%',
                '-trim',
                '+repage',
                '-resize',
                '980x220>',
                $headerPngPath,
            ], $workingDirectory);

            $this->runProcess([
                'magick',
                $composedPngPath,
                $headerPngPath,
                '-gravity',
                'north',
                '-geometry',
                '+0+25',
                '-composite',
                $composedPngPath,
            ], $workingDirectory);
        }

        $footerAssetPath = storage_path('app/private/templates/footer.png');
        if (is_file($footerAssetPath)) {
            $this->runProcess([
                'magick',
                $footerAssetPath,
                '-fuzz',
                '6%',
                '-trim',
                '+repage',
                '-resize',
                '980x180>',
                $footerPngPath,
            ], $workingDirectory);

            $this->runProcess([
                'magick',
                $composedPngPath,
                $footerPngPath,
                '-gravity',
                'south',
                '-geometry',
                '+0+20',
                '-composite',
                $composedPngPath,
            ], $workingDirectory);
        }

        $this->runProcess([
            'magick',
            $composedPngPath,
            '(',
            $signaturePngPath,
            '-resize',
            '300x110>',
            ')',
            '-gravity',
            'southeast',
            '-geometry',
            '+140+430',
            '-composite',
            $composedPngPath,
        ], $workingDirectory);

        $this->runProcess([
            'magick',
            $composedPngPath,
            $outputPdfPath,
        ], $workingDirectory);

        return $outputPdfPath;
    }

    private function hasImageMagickToolchain(): bool
    {
        $finder = new ExecutableFinder;

        return $finder->find('gs') !== null && $finder->find('magick') !== null;
    }

    /**
     * @param  array<int, string>  $approvedTitles
     */
    private function generateFallbackPdf(
        string $outputPdfPath,
        string $signatureDataUrl,
        array $approvedTitles,
        string $submittedByNames,
        string $adviserName,
        CarbonInterface $signedAt,
        ?string $programCode
    ): void {
        $lines = [];
        $headerImage = $this->loadTemplateImage(storage_path('app/private/templates/header.png'));
        $footerImage = $this->loadTemplateImage(storage_path('app/private/templates/footer.png'));
        $signatureImage = $this->extractSignatureImage($signatureDataUrl);
        $imageMap = [];

        if (is_array($headerImage)) {
            $headerSize = $this->calculateImageDrawSize($headerImage, 595.0, 220.0);
            $headerX = 0.0;
            $headerY = 842.0 - $headerSize['height'];
            $this->appendPdfImageCommand($lines, 'HEADER', $headerX, $headerY, $headerSize['width'], $headerSize['height']);
            $imageMap['HEADER'] = $headerImage;
            $titleY = max(640, (int) floor($headerY - 22.0));
        } else {
            $titleY = 790;
        }

        $footerTopEdgeY = 0.0;
        if (is_array($footerImage)) {
            $footerSize = $this->calculateImageDrawSize($footerImage, 595.0, 160.0);
            $footerX = 0.0;
            $footerY = 0.0;
            $this->appendPdfImageCommand($lines, 'FOOTER', $footerX, $footerY, $footerSize['width'], $footerSize['height']);
            $imageMap['FOOTER'] = $footerImage;
            $footerTopEdgeY = $footerY + $footerSize['height'];
        }

        $this->appendPdfCenteredTextLine($lines, 'F2', 14, $titleY, 'RECOMMENDATION FOR TITLE DEFENSE');
        $y = $titleY - 30;
        $degreeName = $this->resolveDegreeProgramName($programCode);
        $introText = sprintf(
            'In partial fulfillment of the requirements for the degree %s, this Capstone Project Concept Papers:',
            $degreeName
        );
        $y = $this->appendPdfJustifiedStyledParagraph(
            $lines,
            [['font' => 'F1', 'size' => 11, 'text' => $introText]],
            52,
            $y,
            503.0,
            16
        );
        $y -= 4;

        foreach ($this->buildTitleLines($approvedTitles) as $titleLine) {
            foreach ($this->wrapText($titleLine, 82) as $wrappedTitleLine) {
                $this->appendPdfTextLine($lines, 'F2', 11, 64, $y, $wrappedTitleLine);
                $y -= 16;
            }
        }

        $y -= 10;
        $y = $this->appendPdfJustifiedStyledParagraph(
            $lines,
            [
                ['font' => 'F1', 'size' => 11, 'text' => 'The capstone title(s) listed above has been prepared and submitted by'],
                ['font' => 'F2', 'size' => 11, 'text' => $submittedByNames],
                ['font' => 'F1', 'size' => 11, 'text' => 'and are recommended for title defense.'],
            ],
            52,
            $y,
            503.0,
            16
        );

        $signatureBlockCenterX = 492.0;
        $nameY = $footerTopEdgeY > 0.0 ? 166 : 132;
        $labelY = $nameY - 14;
        $signatureY = $footerTopEdgeY > 0.0 ? 122.0 : 88.0;
        $dateY = $footerTopEdgeY > 0.0 ? 104 : 72;

        if (is_array($signatureImage)) {
            $signatureSize = $this->calculateImageDrawSize($signatureImage, 120.0, 34.0);
            $signatureX = $signatureBlockCenterX - ($signatureSize['width'] / 2.0);
            $this->appendPdfImageCommand($lines, 'SIG', $signatureX, $signatureY, $signatureSize['width'], $signatureSize['height']);
            $imageMap['SIG'] = $signatureImage;
        }

        $this->appendPdfTextCenteredAtX($lines, 'F2', 12, $signatureBlockCenterX, $nameY, $adviserName);
        $this->appendPdfTextCenteredAtX($lines, 'F1', 11, $signatureBlockCenterX, $labelY, 'Adviser');

        $minimumDateY = (int) ceil($footerTopEdgeY + 10.0);
        $this->appendPdfTextCenteredAtX($lines, 'F1', 10, $signatureBlockCenterX, max($dateY, $minimumDateY), 'Date Signed: '.$signedAt->format('F d, Y'));

        $pdfContent = implode("\n", $lines);
        $pdfDocument = $this->buildSimplePdfDocument($pdfContent, $imageMap);
        File::put($outputPdfPath, $pdfDocument);
    }

    private function resolveDegreeProgramName(?string $programCode): string
    {
        $normalizedProgramCode = strtoupper(trim((string) $programCode));

        return match ($normalizedProgramCode) {
            'BSIS' => 'Bachelor of Science in Information Systems',
            'BSIT' => 'Bachelor of Science in Information Technology',
            default => 'Bachelor of Science in Information Technology',
        };
    }

    private function appendPdfTextLine(array &$lines, string $fontKey, int $fontSize, int $x, int $y, string $text): void
    {
        $safeText = $this->escapePdfText($text);
        $lines[] = "BT /{$fontKey} {$fontSize} Tf {$x} {$y} Td ({$safeText}) Tj ET";
    }

    private function appendPdfCenteredTextLine(array &$lines, string $fontKey, int $fontSize, int $y, string $text): void
    {
        $x = (595.0 - $this->estimatePdfTextWidth($text, $fontSize)) / 2.0;
        $this->appendPdfTextLine($lines, $fontKey, $fontSize, (int) round(max(24.0, $x)), $y, $text);
    }

    private function appendPdfTextCenteredAtX(array &$lines, string $fontKey, int $fontSize, float $centerX, int $y, string $text): void
    {
        $x = $centerX - ($this->estimatePdfTextWidth($text, $fontSize) / 2.0);
        $this->appendPdfTextLine($lines, $fontKey, $fontSize, (int) round(max(24.0, $x)), $y, $text);
    }

    private function appendPdfRightAlignedTextLine(array &$lines, string $fontKey, int $fontSize, float $rightEdgeX, int $y, string $text): void
    {
        $x = $rightEdgeX - $this->estimatePdfTextWidth($text, $fontSize);
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
            ['\\\\', '\(', '\)', '', '', ' '],
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

    private function estimatePdfGapWidth(int $fontSize, bool $isSegmentBoundary = false): float
    {
        $baseGap = $this->estimatePdfSpaceWidth($fontSize);
        if (! $isSegmentBoundary) {
            return $baseGap;
        }

        return $baseGap + ($fontSize * 0.18);
    }

    /**
     * @param  array<int, array{font: string, size: int, text: string}>  $segments
     * @return array<int, array{font: string, size: int, text: string, segment: int}>
     */
    private function buildStyledWordTokens(array $segments): array
    {
        $tokens = [];

        foreach ($segments as $segmentIndex => $segment) {
            $font = (string) ($segment['font'] ?? 'F1');
            $size = (int) ($segment['size'] ?? 11);
            $text = trim((string) ($segment['text'] ?? ''));
            if ($text === '') {
                continue;
            }

            $words = preg_split('/\s+/', $text) ?: [];
            foreach ($words as $word) {
                $normalizedWord = trim((string) $word);
                if ($normalizedWord === '') {
                    continue;
                }

                $tokens[] = [
                    'font' => $font,
                    'size' => $size,
                    'text' => $normalizedWord,
                    'segment' => $segmentIndex,
                ];
            }
        }

        return $tokens;
    }

    /**
     * @param  array<int, array{font: string, size: int, text: string, segment: int}>  $tokens
     */
    private function appendPdfStyledTokenLine(
        array &$lines,
        array $tokens,
        int $startX,
        int $y,
        float $maxWidth,
        float $lineWidth,
        bool $justify
    ): void {
        if ($tokens === []) {
            return;
        }

        $gapCount = count($tokens) - 1;
        $extraGapWidth = 0.0;
        if ($justify && $gapCount > 0) {
            $extraGapWidth = max(0.0, ($maxWidth - $lineWidth) / $gapCount);
        }

        $x = (float) $startX;
        foreach ($tokens as $index => $token) {
            $font = (string) ($token['font'] ?? 'F1');
            $size = (int) ($token['size'] ?? 11);
            $text = (string) ($token['text'] ?? '');
            if ($text === '') {
                continue;
            }

            $this->appendPdfTextLine($lines, $font, $size, (int) round($x), $y, $text);
            $x += $this->estimatePdfTextWidth($text, $size);

            if ($index < $gapCount) {
                $nextToken = $tokens[$index + 1];
                $nextSize = (int) ($nextToken['size'] ?? $size);
                $isSegmentBoundary = (int) ($token['segment'] ?? -1) !== (int) ($nextToken['segment'] ?? -1);
                $x += $this->estimatePdfGapWidth($nextSize, $isSegmentBoundary) + $extraGapWidth;
            }
        }
    }

    /**
     * @param  array<int, array{font: string, size: int, text: string}>  $segments
     */
    private function appendPdfJustifiedStyledParagraph(
        array &$lines,
        array $segments,
        int $startX,
        int $startY,
        float $maxWidth,
        int $lineHeight
    ): int {
        $tokens = $this->buildStyledWordTokens($segments);
        if ($tokens === []) {
            return $startY;
        }

        $paragraphLines = [];
        $currentLineTokens = [];
        $currentLineWidth = 0.0;

        foreach ($tokens as $token) {
            $tokenSize = (int) ($token['size'] ?? 11);
            $tokenText = (string) ($token['text'] ?? '');
            $tokenWidth = $this->estimatePdfTextWidth($tokenText, $tokenSize);
            $candidateWidth = $currentLineWidth + $tokenWidth;

            if ($currentLineTokens !== []) {
                $previousToken = $currentLineTokens[count($currentLineTokens) - 1];
                $isSegmentBoundary = (int) ($previousToken['segment'] ?? -1) !== (int) ($token['segment'] ?? -1);
                $candidateWidth += $this->estimatePdfGapWidth($tokenSize, $isSegmentBoundary);
            }

            if ($currentLineTokens !== [] && $candidateWidth > $maxWidth) {
                $paragraphLines[] = [
                    'tokens' => $currentLineTokens,
                    'width' => $currentLineWidth,
                ];
                $currentLineTokens = [$token];
                $currentLineWidth = $tokenWidth;

                continue;
            }

            if ($currentLineTokens !== []) {
                $previousToken = $currentLineTokens[count($currentLineTokens) - 1];
                $isSegmentBoundary = (int) ($previousToken['segment'] ?? -1) !== (int) ($token['segment'] ?? -1);
                $currentLineWidth += $this->estimatePdfGapWidth($tokenSize, $isSegmentBoundary);
            }

            $currentLineTokens[] = $token;
            $currentLineWidth += $tokenWidth;
        }

        if ($currentLineTokens !== []) {
            $paragraphLines[] = [
                'tokens' => $currentLineTokens,
                'width' => $currentLineWidth,
            ];
        }

        $y = $startY;
        foreach ($paragraphLines as $lineIndex => $line) {
            $lineTokens = (array) ($line['tokens'] ?? []);
            $lineWidth = (float) ($line['width'] ?? 0.0);
            $isLastLine = $lineIndex === count($paragraphLines) - 1;
            $shouldJustify = ! $isLastLine && count($lineTokens) > 1;

            $this->appendPdfStyledTokenLine(
                $lines,
                $lineTokens,
                $startX,
                $y,
                $maxWidth,
                $lineWidth,
                $shouldJustify
            );

            $y -= $lineHeight;
        }

        return $y;
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
     * @param  array<string, array{width: int, height: int, rgb_data: string, alpha_data: string|null}>  $images
     */
    private function buildSimplePdfDocument(string $contentStream, array $images = []): string
    {
        $pageResources = '<< /ProcSet [/PDF /Text /ImageC] /Font << /F1 4 0 R /F2 5 0 R >>';
        $xObjectEntries = [];

        $objects = [
            1 => '<< /Type /Catalog /Pages 2 0 R >>',
            2 => '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            3 => '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources '.$pageResources.' /Contents 6 0 R >>',
            4 => '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
            5 => '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
            6 => '<< /Length '.strlen($contentStream)." >>\nstream\n{$contentStream}\nendstream",
        ];

        $nextObjectId = 7;
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
        $objects[3] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources '.$pageResources.' /Contents 6 0 R >>';

        ksort($objects);

        $output = "%PDF-1.4\n";
        $offsets = [0];

        foreach ($objects as $index => $objectBody) {
            $offsets[$index] = strlen($output);
            $output .= "{$index} 0 obj\n{$objectBody}\nendobj\n";
        }

        $startXref = strlen($output);
        $output .= 'xref'."\n";
        $output .= '0 '.(count($objects) + 1)."\n";
        $output .= "0000000000 65535 f \n";

        foreach (array_keys($objects) as $index) {
            $output .= sprintf('%010d 00000 n ', $offsets[$index])."\n";
        }

        $output .= 'trailer'."\n";
        $output .= '<< /Size '.(count($objects) + 1).' /Root 1 0 R >>'."\n";
        $output .= 'startxref'."\n";
        $output .= $startXref."\n";
        $output .= '%%EOF';

        return $output;
    }

    private function writeSignaturePng(string $signatureDataUrl, string $destinationPath): void
    {
        File::put($destinationPath, $this->decodeSignaturePngData($signatureDataUrl));
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

    /**
     * @param  array<int, string>  $approvedTitles
     * @return array<int, string>
     */
    private function buildTitleLines(array $approvedTitles): array
    {
        if ($approvedTitles === []) {
            return ['Title 1: (No approved concept title provided)'];
        }

        return collect($approvedTitles)
            ->values()
            ->map(function (string $title, int $index): string {
                return sprintf('Title %d: %s', $index + 1, trim($title));
            })
            ->all();
    }

    /**
     * @return array<int, string>
     */
    private function wrapText(string $value, int $charactersPerLine): array
    {
        return collect(preg_split('/\R/', wordwrap(trim($value), $charactersPerLine)))
            ->filter(fn (?string $line): bool => is_string($line) && trim($line) !== '')
            ->values()
            ->all();
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
     * @param  array<int, string>  $command
     */
    private function runProcess(array $command, string $workingDirectory): void
    {
        $process = new Process($command, $workingDirectory);
        $process->setTimeout(60);
        $process->run();

        if (! $process->isSuccessful()) {
            throw new RuntimeException(trim($process->getErrorOutput()) !== '' ? trim($process->getErrorOutput()) : 'Unable to generate recommendation PDF.');
        }
    }
}
