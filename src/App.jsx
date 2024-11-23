import { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, ListGroup, Button, Spinner, Table, InputGroup, Form } from 'react-bootstrap';
import WaveSurfer from 'wavesurfer.js';
import Regions from 'wavesurfer.js/dist/plugins/regions';
import { FaTrash, FaRandom, FaPlay, FaPause, FaPlus, FaArrowUp, FaSearch } from 'react-icons/fa';
import CustomModal from './Components/CustomModal'
import ImportModal from './Components/ImportModal'
import ExportModal from './Components/ExportModal'
import { getRandomBrightColor, generateUUID } from './utils';


function App() {
	const [showExportModal, setShowExportModal] = useState(false);
	const [showImportModal, setShowImportModal] = useState(false);
	const [showHelpModal, setShowHelpModal] = useState(false);
	const [inMainFrame, setInMainFrame] = useState(false);

	const [markupTracks, setMarkupTracks] = useState({});
	const [tracks, setTracks] = useState({});
	const [currentTrackIndex, setCurrentTrackIndex] = useState(null);
	const [currentTrack, setCurrentTrack] = useState(null);
	const wavesurferRef = useRef(null);
	const [volume, setVolume] = useState(0.5);
	const [selectedRegionId, setSelectedRegionId] = useState(null);
	const waveContainerRef = useRef(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [loading, setLoading] = useState(false);

	const [showScrollButton, setShowScrollButton] = useState(false);
	const listRef = useRef(null);

	const [searchTerm, setSearchTerm] = useState('');

	const fileInputRef = useRef(null);

	const handleScroll = () => {
		if (listRef.current) {
			const isVisible = listRef.current.scrollTop > 100;
			setShowScrollButton(isVisible);
		}
	};

	const handleFolderSelect = (event) => {
		const files = Array.from(event.target.files)
			.filter(file => {
				return file.type.startsWith('audio/') ||
					/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name);
			})
			.sort((a, b) => a.name.localeCompare(b.name));


		const newTracks = {};
		const markupTracks = {};
		files.forEach(file => {
			newTracks[file.name] = file;
			markupTracks[file.name] = [];
		});

		setTracks(prevTracks => ({ ...prevTracks, ...newTracks }));
		setMarkupTracks(prevTracks => ({ ...prevTracks, ...markupTracks }));
	};

	useEffect(() => {
		if (tracks && Object.keys(tracks).length > 0) {
			handleTrackSelect(Object.keys(tracks)[0])
		}
	}, [tracks]);

	const goToNextTrack = () => {
		if (currentTrackIndex !== null && currentTrackIndex < Object.keys(tracks).length - 1) {
			const nextTrack = Object.keys(tracks)[currentTrackIndex + 1];
			handleTrackSelect(nextTrack);
		}
	};

	const goToPreviousTrack = () => {
		if (currentTrackIndex > 0) {
			const previousTrack = Object.keys(tracks)[currentTrackIndex - 1];
			handleTrackSelect(previousTrack);
		}
	};

	const handleTrackSelect = (filename) => {
		const selectedFile = tracks[filename];

		if (!selectedFile) {
			console.error("Selected file not found in tracks:", filename);
			console.error('Tracks: ', tracks)
			return;
		}

		const url = URL.createObjectURL(selectedFile);
		setCurrentTrack(filename);
		const index = Object.keys(tracks).indexOf(filename);
		setCurrentTrackIndex(index);
		setLoading(true);
		if (wavesurferRef.current) {
			wavesurferRef.current.load(url);
		}
	};

	const handleKeyDown = (event) => {
		if (event.key === 'F1') {
			event.preventDefault();
			handleShowHelpModal();
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			goToPreviousTrack();
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			goToNextTrack();
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			handleVolumeChange(0.1);
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			handleVolumeChange(-0.1);
		} else if (event.ctrlKey && event.key === 's') {
			event.preventDefault();
			handleShowExportModal()
		} else if (event.key === 'n') {
			if (inMainFrame) {
				event.preventDefault();
				addMarkupRegion(0, 5)
			}
		} else if (event.key === 'i') {
			if (inMainFrame) {
				event.preventDefault();
				handleShowImportModal();
			}
		} else if (event.key === 'e') {
			if (inMainFrame) {
				event.preventDefault();
				handleShowExportModal();
			}
		} else if ((event.key === 'd' || event.key === 'Delete') && selectedRegionId) {
			if (inMainFrame) {
				event.preventDefault();
				removeRegion(selectedRegionId);
			}
		} else if (event.key === 'Space' || event.key === " ") {
			if (inMainFrame) {
				event.preventDefault();
				handlePlayPauseToggle()
			}
		}
	};


	useEffect(() => {
		wavesurferRef.current = WaveSurfer.create({
			container: waveContainerRef.current,
			waveColor: 'violet',
			progressColor: 'purple',
			height: 128,
			responsive: true,
			plugins: [
				Regions.create({
					dragSelection: {
						slop: 5,
					},
				}),
			],
		});

		wavesurferRef.current.setVolume(volume);

		wavesurferRef.current.on('ready', () => {
			setLoading(false);
			loadRegions();
		});

		wavesurferRef.current.on('finish', () => {
			setIsPlaying(false);
		});

		const listElement = listRef.current;
		if (listElement) {
			listElement.addEventListener('scroll', handleScroll);
		}



		return () => {
			wavesurferRef.current.destroy()
			if (listElement) {
				listElement.removeEventListener('scroll', handleScroll);
			}
		};
	}, []);

	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [currentTrackIndex, selectedRegionId, isPlaying])

	const scrollToTop = () => {
		if (listRef.current) {
			listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
		}
	};

	const loadRegions = () => {
		if (!wavesurferRef.current || !currentTrack) return;

		const regionPlugin = wavesurferRef.current.plugins[0];
		regionPlugin.clearRegions();

		const currentRegions = markupTracks[currentTrack] || [];
		currentRegions.forEach(region => {
			regionPlugin.addRegion({
				start: region.start,
				end: region.end,
				color: region.color,
				drag: true,
				resize: true,
				id: region.id
			});
		});

		const handleRegionUpdate = (region) => {

			updateRegionInMarkupTracks(region);
		};

		const handleRegionRemove = (region) => {
			removeRegionFromMarkupTracks(region);
		};

		regionPlugin.on('region-updated', handleRegionUpdate);
		regionPlugin.on('region-remove', handleRegionRemove);


		return () => {
			regionPlugin.un('region-updated', handleRegionUpdate);
			regionPlugin.un('region-remove', handleRegionRemove);
		};
	};

	useEffect(() => {
		const updateTrackLength = () => {
			resetPlayerStatus()
			loadRegions();
		};
		wavesurferRef.current.on('ready', updateTrackLength);

		return () => {
			wavesurferRef.current.un('ready', updateTrackLength);
		};
	}, [currentTrack]);


	const handlePlayPauseToggle = () => {
		if (isPlaying) {
			wavesurferRef.current.pause();
		} else {
			wavesurferRef.current.play();
		}
		setIsPlaying(!isPlaying);
	};
	const resetPlayerStatus = () => {
		setIsPlaying(false);
		wavesurferRef.current.seekTo(0);
	}

	const addMarkupRegion = (start, end) => {
		if (wavesurferRef.current && wavesurferRef.current.plugins[0] && currentTrack) {
			const color = getRandomBrightColor();
			const id = generateUUID(8);

			wavesurferRef.current.plugins[0].addRegion({
				start: start,
				end: end,
				color: color,
				drag: true,
				resize: true,
				id: id
			});
			setSelectedRegionId(id);
			setMarkupTracks(prev => ({
				...prev,
				[currentTrack]: [...prev[currentTrack], { start, end, color, id }]
			}));
		}
	};

	const updateRegionInMarkupTracks = (region) => {
		const { start, end, id } = region;
		setSelectedRegionId(id);

		setMarkupTracks(prev => {
			const currentTrackRegions = prev[currentTrack] || [];
			const updatedRegions = currentTrackRegions.map(r => {
				if (r.id === id) {
					return { ...r, start, end };
				}
				return r;
			});

			return {
				...prev,
				[currentTrack]: updatedRegions
			};
		});
	};


	const removeRegionFromMarkupTracks = (region) => {
		const { id } = region;

		setMarkupTracks(prev => {
			const currentTrackRegions = prev[currentTrack] || [];
			const filteredRegions = currentTrackRegions.filter(r => r.id !== id);
			return {
				...prev,
				[currentTrack]: filteredRegions
			};
		});
	};


	const removeRegion = (id) => {
		if (!wavesurferRef.current) return;

		const regions = Object.values(wavesurferRef.current.plugins[0].regions);

		const regionToRemove = regions.find(region => region.id === id);
		if (regionToRemove) {
			regionToRemove.remove();
			setSelectedRegionId(null);
		}

		setMarkupTracks(prev => {
			const currentTrackRegions = prev[currentTrack] || [];
			const updatedRegions = currentTrackRegions.filter(region => region.id !== id);

			return {
				...prev,
				[currentTrack]: updatedRegions
			};
		});
	};


	const changeRegionColor = (id) => {
		if (!wavesurferRef.current) return;

		const newColor = getRandomBrightColor();

		const regions = Object.values(wavesurferRef.current.plugins[0].regions);

		const regionToChange = regions.find(region => region.id === id);

		if (regionToChange) {
			const { start, end } = regionToChange;
			regionToChange.remove();

			wavesurferRef.current.plugins[0].addRegion({
				start: start,
				end: end,
				color: newColor,
				drag: true,
				resize: true,
				id: id
			});

			setMarkupTracks(prev => {
				const currentTrackRegions = prev[currentTrack] || [];
				const updatedRegions = currentTrackRegions.map(region => {
					if (region.id === id) {
						return { ...region, color: newColor };
					}
					return region;
				});

				return {
					...prev,
					[currentTrack]: updatedRegions
				};
			});
		}
	};


	const handleShowImportModal = () => {
		if (Object.keys(tracks).length === 0) {
			alert("No tracks found. Please import a track first.");
			return;
		}
		setShowImportModal(true)
	}
	const handleShowExportModal = () => {
		if (Object.keys(tracks).length === 0) {
			alert("No tracks found. Please import a track first.");
			return;
		}
		setShowExportModal(true)
	};
	const handleCloseExportModal = () => setShowExportModal(false);
	const handleCloseImportModal = () => setShowImportModal(false);


	const handleShowHelpModal = () => setShowHelpModal(true);
	const handleCloseHelpModal = () => setShowHelpModal(false);


	const handleVolumeChange = (delta) => {
		setVolume(prevVolume => {
			const newVolume = Math.min(1, Math.max(0, prevVolume + delta));
			wavesurferRef.current.setVolume(newVolume);
			return newVolume;
		});
	};


	useEffect(() => {
		if (markupTracks) {
			loadRegions()
		}
	}, [markupTracks]);

	useEffect(() => {
		setInMainFrame(showExportModal === false && showImportModal === false && showHelpModal === false)
	}, [showExportModal, showImportModal, showHelpModal])


	return (
		<Container fluid style={{ height: '100vh', overflow: 'hidden' }}>
			{loading && (
				<div className="loader-overlay">
					<Spinner animation="border" role="status">
						<span className="visually-hidden">Loading...</span>
					</Spinner>
				</div>
			)}
			<Row style={{ height: '100%' }}>
				<Col md={3} className="p-3" style={{ borderRight: '1px solid #dee2e6', height: '100%', overflow: 'hidden', position: 'relative' }}>
					<h4>Selecting a folder</h4>
					<input
						type="file"
						webkitdirectory="true"
						directory=""
						multiple
						ref={fileInputRef}
						className="form-control mb-3"
						onChange={handleFolderSelect}
					/>
					<h5>Files in the folder:</h5>
					<InputGroup className="mb-3">
						<InputGroup.Text>
							<FaSearch />
						</InputGroup.Text>
						<input
							type="text"
							placeholder="File Search..."
							className="form-control"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</InputGroup>

					<div
						ref={listRef}
						style={{
							maxHeight: 'calc(100vh - 200px)',
							overflowY: 'auto',
							overflowX: 'hidden',
							paddingBottom: '50px',
						}}
					>
						<ListGroup>
							{Object.keys(tracks)
								.filter((filename) => filename.toLowerCase().includes(searchTerm.toLowerCase()))
								.map((filename, index) => (
									<ListGroup.Item
										key={index}
										onClick={() => handleTrackSelect(filename)}
										style={{
											cursor: 'pointer',
											backgroundColor: filename === currentTrack ? '#007bff' : 'transparent', // Меняем фон для текущего трека
											color: filename === currentTrack ? '#fff' : '#000', // Меняем цвет текста для текущего трека
										}}
									>
										{filename}
									</ListGroup.Item>
								))}
						</ListGroup>
					</div>

					{showScrollButton && (
						<Button
							variant="secondary"
							className="scroll-to-top"
							onClick={scrollToTop}
							style={{
								position: 'absolute',
								bottom: '20px',
								right: '20px',
								zIndex: 1000,
							}}
						>
							<FaArrowUp />
						</Button>
					)}
				</Col>

				<Col md={9} className="p-3" style={{ height: '100%' }}>
					<h4>Audio: {currentTrack}</h4>
					<div ref={waveContainerRef} id="waveform" style={{ border: '1px solid #dee2e6', height: '128px' }}></div>
					<div className="mt-3 d-flex flex-column gap-3">
						{/* Import/Export Buttons */}
						<div className="d-flex justify-content-end align-items-center gap-2">
							<Button variant="primary" onClick={() => handleShowImportModal()}>
								Import
							</Button>
							{currentTrack && (
								<Button
									variant="primary"
									onClick={() => handleShowExportModal()}
								>
									Export
								</Button>
							)}
						</div>

						{/* Controls for current track */}
						{currentTrack && (
							<div className="d-flex flex-wrap gap-2 align-items-center">
								<Button
									variant={isPlaying ? 'danger' : 'success'}
									onClick={handlePlayPauseToggle}
								>
									{isPlaying ? <FaPause /> : <FaPlay />}
									{isPlaying ? ' Pause' : ' Play'}
								</Button>

								<Button
									variant="secondary"
									onClick={() => addMarkupRegion(0, 5)}
								>
									<FaPlus /> Add a label
								</Button>

								<Button
									variant="secondary"
									onClick={goToPreviousTrack}
									disabled={currentTrackIndex <= 0}
								>
									Previous {currentTrackIndex > 0 && `(${Object.keys(tracks)[currentTrackIndex - 1]})`}
								</Button>
								<Button
									variant="secondary"
									onClick={goToNextTrack}
									disabled={
										currentTrackIndex === null ||
										currentTrackIndex >= Object.keys(tracks).length - 1
									}
								>
									Next {currentTrackIndex < Object.keys(tracks).length - 1 && `(${Object.keys(tracks)[currentTrackIndex + 1]})`}
								</Button>
							</div>
						)}
					</div>



					{currentTrack && markupTracks[currentTrack] && markupTracks[currentTrack].length > 0 && (
						<div className="mt-3">
							<h5>Added labels:</h5>
							<Table striped bordered hover>
								<thead>
									<tr>
										<th>ID</th>
										<th>Start</th>
										<th>End</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{markupTracks[currentTrack].map((region, index) => (
										<tr key={region.id}>
											<td>{region.id}</td>
											<td>{region.start.toFixed(2)}</td>
											<td>{region.end.toFixed(2)}</td>
											<td>
												<Button variant="danger" onClick={() => removeRegion(region.id)}>
													<FaTrash /> Delete
												</Button>
												<Button variant="primary" onClick={() => changeRegionColor(region.id)} className="ms-2">
													<FaRandom /> Change color
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</Table>
						</div>
					)}
				</Col>
			</Row>

			<ImportModal
				showImportModal={showImportModal}
				handleCloseImportModal={handleCloseImportModal}
				setMarkupTracks={setMarkupTracks}
				loadRegions={loadRegions} />

			<ExportModal
				showExportModal={showExportModal}
				// handleExportButton={handleExportButton}
				handleCloseExportModal={handleCloseExportModal}
				markupTracks={markupTracks}
			/>

			{/* Export modal */}
			{/* <CustomModal show={showExportModal} handleClose={handleCloseExportModal} title="Export dataset">
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
									setExportFilePath(e.target.value);
									generatePreview(exportFormat);
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
			</CustomModal> */}

			{/* Help modal */}
			<CustomModal show={showHelpModal} handleClose={handleCloseHelpModal} title="Help">
				<h5>Useful Shortcuts</h5>
				<p>Here are some keyboard shortcuts that can help you work faster:</p>

				<Table striped bordered hover variant="light" className="mt-3">
					<thead>
						<tr>
							<th>Shortcut</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td><kbd>F1</kbd></td>
							<td>Show this message</td>
						</tr>
						<tr>
							<td><kbd>←</kbd> / <kbd>→</kbd></td>
							<td>Previous or next track</td>
						</tr>
						<tr>
							<td><kbd>↑</kbd> / <kbd>↓</kbd></td>
							<td>Increase/decrease the playback volume</td>
						</tr>
						<tr>
							<td><kbd>N</kbd></td>
							<td>Add a new region</td>
						</tr>
						<tr>
							<td><kbd>I</kbd></td>
							<td>Import dataset</td>
						</tr>
						<tr>
							<td><kbd>E</kbd></td>
							<td>Export dataset</td>
						</tr>
						<tr>
							<td><kbd>D</kbd> / <kbd>Delete</kbd></td>
							<td>Delete the selected region (selected when moving)</td>
						</tr>
						<tr>
							<td><kbd>Ctrl</kbd> + <kbd>S</kbd></td>
							<td>Export</td>
						</tr>
						<tr>
							<td><kbd>Space</kbd></td>
							<td>Turn on/stop track playback</td>
						</tr>
					</tbody>
				</Table>
			</CustomModal>
		</Container>
	);
}

export default App
