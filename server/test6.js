// const test = async () => {
//     try {
//         const data = {
//             urls: ["https://res.cloudinary.com/dxc2vrlcu/image/upload/fl_attachment/testing2_tep4r4.pdf?_a=BAMAK+a60",
//                 "https://res.cloudinary.com/dxc2vrlcu/image/upload/fl_attachment/testing_3_cvziza.pdf?_a=BAMAK+a60"],
//             clientName: "nwigiri joshua",
//             location: "25 badagry estate",
//             email: "joshuadebravo@gmail.com"
//         };
//         // base url :  https://formcast-realtor.vercel.app http://localhost:5000
//         const response = await axios.post("http://localhost:5000/api/pdf/send", data);
//         console.log(response.data);
//     } catch (error) {
//         console.error("Request failed:", error.response?.data || error.message);
//     }
// };

test();
cloudinary.config({
    cloud_name: '',
    api_key: '',
    api_secret: '',
});

const publicId = 'testing_3_cvziza';

const downloadUrl = cloudinary.url(publicId, {
    resource_type: 'image',
    format: 'pdf',
    flags: 'attachment'
});

console.log(downloadUrl);