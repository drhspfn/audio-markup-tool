import React, { useState, useEffect } from 'react';
import CustomModal from './CustomModal';
import { Dropdown, Button, Form } from 'react-bootstrap';
import { joinPath } from '../utils';


function ExportModal({
    showExportModal, handleCloseExportModal,
    markupTracks,
}) {
    const [exportFormat, setExportFormat] = useState('json');
    const [exportFilePath, setExportFilePath] = useState('');
    const [exportPreviewData, setExportPreviewData] = useState('');
    const [exportOnlyLabeledTracks, setExportOnlyLabeledTracks] = useState(false);


    const generatePreview = (format) => {
        if (format === 'json') {
            const sampleData = {
                'settings': {
                    'path': exportFilePath,
                    'max-timings': 0
                },
                'data': [
                    {
                        name: `${exportFilePath}/1.mp3`,
                        regions: [
                            [0, 30.1],
                            [45.4, 80]
                        ]
                    }
                ]
            }
            // const sampleData = [
            //     {
            //         name: `${exportFilePath}/1.mp3`,
            //         regions: [
            //             [0, 30.1],
            //             [45.4, 80]
            //         ]
            //     }
            // ];
            setExportPreviewData(JSON.stringify(sampleData, null, 2));
        } else if (format === 'csv') {
            const csvContent = `path,start,end\n${exportFilePath}/1.mp3,21.5,84.3`;
            setExportPreviewData(csvContent);
        }
    };

    const handleFormatChange = (format) => {
        setExportFormat(format);
        generatePreview(format);
    };
    const handleUpdateExportPath = (path) => {
        setExportFilePath(path);
        generatePreview(exportFormat);
    }
    const handleToggleSelectedTracks = () => {
        setExportOnlyLabeledTracks(!exportOnlyLabeledTracks);
    };

    

    const getStatistics = (markupTracks) => {
        const totalFiles = Object.keys(markupTracks).length;
        let nonEmptyFilesCount = 0;
        let emptyFilesCount = 0;

        Object.values(markupTracks).forEach((timings) => {
            if (timings.length > 0) {
                nonEmptyFilesCount++;
            } else {
                emptyFilesCount++;
            }
        });

        return { totalFiles, nonEmptyFilesCount, emptyFilesCount };
    };

    const handleExportButton = (event) => {
        event.preventDefault();
        const finallyResult = {
            'settings': {
                'path': exportFilePath,
                'max-timings': 0
            },
            'data': []
        }

        let exportList = Object.entries(markupTracks).map(([path, timings]) => {
            const formattedTimings = timings.map(timing => [
                parseFloat(timing.start.toFixed(2)),
                parseFloat(timing.end.toFixed(2))
            ]);
            return { path: joinPath(exportFilePath, path), timings: formattedTimings };
        });

        if (exportOnlyLabeledTracks) {
            exportList = exportList.filter(({ timings }) => timings.length > 0);
        }

        const maxTimings = Math.max(...exportList.map(item => item.timings.length));

        if (exportFormat === "json") {
            finallyResult.data = exportList;
            finallyResult.settings['max-timings'] = maxTimings;
            const jsonString = JSON.stringify(finallyResult, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "export_data.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        else if (exportFormat === "csv") {
            const csvRows = [];
            const headers = ['path'];
            for (let i = 0; i < maxTimings; i++) {
                headers.push(`start_${i + 1}`, `end_${i + 1}`);
            }
            csvRows.push(headers.join(','));

            exportList.forEach(({ path, timings }) => {
                const row = [path];
                for (let i = 0; i < maxTimings; i++) {
                    if (i < timings.length) {
                        row.push(timings[i][0], timings[i][1]);
                    } else {
                        row.push('', '');
                    }
                }
                csvRows.push(row.join(','));
            });

            const csvString = csvRows.join("\n");
            const blob = new Blob([csvString], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "export_data.csv";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const { totalFiles, nonEmptyFilesCount, emptyFilesCount } = getStatistics(markupTracks);

    useEffect(() => {
        generatePreview(exportFormat);
    }, [exportFilePath, exportFormat]);

    return (
        <CustomModal show={showExportModal} handleClose={handleCloseExportModal} title="Export dataset">
            <div>
                <Form onSubmit={handleExportButton}>
                    <Form.Group controlId="exportFormat">
                        <Form.Label>Select the export format:</Form.Label>
                        <Dropdown>
                            <Dropdown.Toggle variant="success" id="dropdown-basic">
                                {exportFormat === 'json' ? 'JSON' : 'CSV'}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => handleFormatChange('json')}>JSON</Dropdown.Item>
                                <Dropdown.Item onClick={() => handleFormatChange('csv')}>CSV</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Form.Group>

                    <Form.Group controlId="filePath">
                        <Form.Label>File Path:</Form.Label>
                        <Form.Control
                            type="text"
                            value={exportFilePath}
                            onChange={(e) => {
                                handleUpdateExportPath(e.target.value);
                            }}
                            placeholder="Enter the path to the folder"
                        />
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>Statistics:</Form.Label>
                        <ul>
                            <li>Total Files: {totalFiles}</li>
                            <li>Files with Non-Zero Timings: {nonEmptyFilesCount}</li>
                            <li>Empty Files: {emptyFilesCount}</li>
                        </ul>
                    </Form.Group>

                    <Form.Group controlId="exportOnlyLabeledTracks">
                        <Form.Switch
                            checked={exportOnlyLabeledTracks}
                            onChange={handleToggleSelectedTracks}
                            label={"Only Labeled Tracks"}
                        />
                    </Form.Group>

                    <Form.Group controlId="dataPreview">
                        <Form.Label>Data Preview:</Form.Label>
                        <pre>{exportPreviewData}</pre>
                    </Form.Group>

                    <Button variant="primary" type="submit" style={{ marginTop: '20px' }} onClick={handleExportButton}>
                        Export
                    </Button>
                </Form>
            </div>
        </CustomModal>
    );
}

export default ExportModal;
