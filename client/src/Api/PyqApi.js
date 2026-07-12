import api from "./axios";

// `params` uses comma-separated strings for multi-value filters, e.g.
// { year: "2023,2022", difficulty: "hard", q: "logic", sort: "newest", page: 1 }
export const getPyqs = async (params) => {
    const { data } = await api.get("/pyqs", { params });
    return data;
};

export const getPyqFilters = async () => {
    const { data } = await api.get("/pyqs/filters");
    return data;
};

// Upload a paper (teacher/admin). `formData` carries the metadata fields plus
// the PDF under the "pdfFile" key.
export const uploadPyq = async (formData) => {
    try {
        const { data } = await api.post("/pyqs", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
    } catch (error) {
        const msg = error.response?.data?.message || "Upload failed";
        throw new Error(msg);
    }
};

// Build a Cloudinary "download" URL from a PYQ's fileUrl. The fl_attachment flag
// makes Cloudinary send Content-Disposition: attachment, so the browser
// downloads the file (with its original name) instead of opening it inline —
// works on desktop and mobile alike.
export const pyqDownloadUrl = (fileUrl) =>
    fileUrl ? fileUrl.replace("/upload/", "/upload/fl_attachment/") : null;
