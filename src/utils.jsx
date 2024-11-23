export const getFileName = (path) => {
    const parts = path.split('/'); 
    return parts[parts.length - 1];
};

export const removeRootPath = (rootPath, fullPath) => {
    if (fullPath.startsWith(rootPath)) {
        return fullPath.slice(rootPath.length).replace(/^\/+/, '');
    }
    return fullPath; 
};

export function getRandomBrightColor(op = 0.3) {
	let r, g, b;

	do {
		r = Math.floor(Math.random() * 256);
		g = Math.floor(Math.random() * 256);
		b = Math.floor(Math.random() * 256);
	} while (isDullColor(r, g, b)); // idk..

	return `rgba(${r}, ${g}, ${b}, ${op})`;
}

export const joinPath = (...parts) => parts.join('/').replace(/\/+/g, '/');

export function isDullColor(r, g, b) {
	const brightness = Math.sqrt(
		0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b)
	);
	return brightness < 127;
}
export const generateUUID = (length) => {
    let uuid;

    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        uuid = crypto.randomUUID().slice(0, 8); 
    } else {
        uuid = [...Array(8)].map(() => Math.random().toString(36).charAt(2)).join('');
    }

    if (length && length < uuid.length) {
        return uuid.slice(0, length);
    }

    return uuid;
};
