import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import CustomModal from './CustomModal';
import { getFileName, removeRootPath, getRandomBrightColor, generateUUID } from '../utils';

function ImportModal({ showImportModal, handleCloseImportModal, setMarkupTracks, loadRegions }) {
    const [errorMessage, setErrorMessage] = useState('');



    const handleFileImport = async (event) => {
        const file = event.target.files[0];

        if (!file) {
            setErrorMessage('Please select a file.');
            return;
        }

        const fileType = file.type;

        if (fileType !== 'application/json' && !file.name.endsWith('.json')) {
            setErrorMessage('Selected file is not a JSON file.');
            return;
        }

        try {
            if (fileType === "application/json") {
                const fileContent = await file.text();
                let jsonData = JSON.parse(fileContent);

                const datasetSettings = jsonData.settings || null;
                const datasetData = jsonData.data || null;

                if (!datasetData || !datasetSettings) {
                    throw new Error('Invalid structure in JSON data.');
                }

                const datasetRootPath = datasetSettings.path || null;

                const transformJsonData = (data) => {
                    const isValidStructure = (item) => {
                        return (
                            typeof item.path === 'string' &&
                            Array.isArray(item.timings) &&
                            item.timings.every(timing =>
                                Array.isArray(timing) &&
                                timing.length === 2 &&
                                timing.every(value => typeof value === 'number')
                            )
                        );
                    };

                    const isValid = data.every(isValidStructure);

                    if (!isValid) {
                        throw new Error('Invalid structure in JSON data.');
                    }

                    return data.reduce((acc, item) => {
                        let newPath = item.path;
                        if (datasetRootPath) {
                            newPath = removeRootPath(datasetRootPath, newPath);
                        } else {
                            newPath = getFileName(newPath);
                        }
                        const transformedTimings = item.timings.map(timing => ({
                            start: timing[0], 
                            end: timing[1],   
                            color: getRandomBrightColor(), 
                            id: generateUUID(8) 
                        }));
                        acc[newPath] = transformedTimings;
                        return acc;
                    }, {});
                };

                setMarkupTracks(transformJsonData(datasetData));
                loadRegions()
                handleCloseImportModal()
                alert("The data has been successfully loaded.")
            }

        } catch (error) {
            setErrorMessage('Invalid structure.');
            console.error(error);
        }
    };

    return (
        <CustomModal show={showImportModal} handleClose={handleCloseImportModal} title="Import dataset">
            <Form>
                <Form.Group controlId="importFile">
                    <Form.Label>Select file:</Form.Label>
                    <Form.Control
                        type="file"
                        accept=".json"
                        onChange={handleFileImport}
                    />
                </Form.Group>
                {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
            </Form>
        </CustomModal>
    );
}

export default ImportModal;
