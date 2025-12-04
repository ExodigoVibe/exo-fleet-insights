export interface DepartmentManager {
  displayName: string;
  jobTitle: string;
  department: string;
  email: string;
}

export const departmentManagers: DepartmentManager[] = [
  { displayName: "Aharon Joffe", jobTitle: "Head of Algorithms", department: "R&D", email: "aharon.joffe@exodigo.ai" },
  { displayName: "Alon Bar-Lev", jobTitle: "Chief Software Architect & CISO", department: "R&D", email: "alonbl@exodigo.ai" },
  { displayName: "Arie Abramovici", jobTitle: "VP US Product Strategy & Innovation", department: "R&D", email: "arie.abramovici@exodigo.ai" },
  { displayName: "Ariel Jarovsky", jobTitle: "VP of Software Engineering", department: "R&D", email: "ariel.jarovsky@exodigo.ai" },
  { displayName: "Assaf Shahaf", jobTitle: "Director of Data", department: "R&D", email: "assaf.shahaf@exodigo.ai" },
  { displayName: "Bar Massad", jobTitle: "VP Supply Chain", department: "Supply Chain", email: "bar.massad@exodigo.ai" },
  { displayName: "Dan Cohen", jobTitle: "VP Civil Engineering and Operations", department: "COO & Strategy", email: "dan.cohen@exodigo.ai" },
  { displayName: "Doron Kaminer", jobTitle: "VP Operations, IL", department: "Business IL", email: "doron.kaminer@exodigo.ai" },
  { displayName: "Edward Cooks", jobTitle: "VP Product - Civil Engineering", department: "Product Delivery", email: "edi.cooks@exodigo.ai" },
  { displayName: "Eytan Majar", jobTitle: "Head of Product Design", department: "Product Operations", email: "eytan.majar@exodigo.ai" },
  { displayName: "Guy Inbar", jobTitle: "Director of Engineering", department: "R&D", email: "guy.inbar@exodigo.ai" },
  { displayName: "Iliya Katz", jobTitle: "CSO & GM", department: "Business IL", email: "iliya.katz@exodigo.ai" },
  { displayName: "Ishay Sela", jobTitle: "Head of Product Operations", department: "Product Delivery", email: "ishay.sela@exodigo.ai" },
  { displayName: "Itay Bar-Lev", jobTitle: "Chief Civil Engineer", department: "Product Delivery", email: "itay.barlev@exodigo.ai" },
  { displayName: "Jeremy Suard", jobTitle: "CEO", department: "Management", email: "jeremy@exodigo.ai" },
  { displayName: "Michael Ivanov Avni", jobTitle: "Head of Product - Map Operation", department: "Product", email: "michael.ivanovavni@exodigo.ai" },
  { displayName: "Nir Feller", jobTitle: "Chief Financial Officer", department: "Finance", email: "nir.feller@exodigo.ai" },
  { displayName: "Ofer Tal", jobTitle: "Head of Operations, US", department: "Business Global", email: "ofer.tal@exodigo.ai" },
  { displayName: "Ofri Lehmann", jobTitle: "Chief Product Delivery", department: "Product Delivery", email: "ofri@exodigo.ai" },
  { displayName: "Omer Hameiri", jobTitle: "Chief Product Officer", department: "Product Operations", email: "omer.hameiri@exodigo.ai" },
  { displayName: "Oren Ben Ibghei", jobTitle: "Head Of IT", department: "R&D", email: "oren.benibghei@exodigo.ai" },
  { displayName: "Oriel Halvani", jobTitle: "VP R&D", department: "R&D", email: "orielh@exodigo.ai" },
  { displayName: "Rabin Shaltiel", jobTitle: "VP Geotech Product", department: "R&D", email: "rabin.shaltiel@exodigo.ai" },
  { displayName: "Ran Gotliv", jobTitle: "Head of product operations IL", department: "Product Operations", email: "ran.gotliv@exodigo.ai" },
  { displayName: "Rod Dean Lacy", jobTitle: "VP Ops US", department: "Business Global", email: "rod.lacy@exodigo.ai" },
  { displayName: "Roee Oron", jobTitle: "VP Product Operations", department: "Product Operations", email: "roee.oron@exodigo.ai" },
  { displayName: "Roee Rubin", jobTitle: "Head of Signal Analyst", department: "Product Operations", email: "roee.rubin@exodigo.ai" },
  { displayName: "Yahav Aframian", jobTitle: "Director of Operations Strategy", department: "Product", email: "yahav.aframian@exodigo.ai" },
  { displayName: "Yossi Pelech", jobTitle: "Chief Hardware Architect", department: "R&D", email: "yossi.pelech@exodigo.ai" },
  { displayName: "Yuval Bracha", jobTitle: "Head of Global Team", department: "Product Delivery", email: "yuval.bracha@exodigo.ai" },
];

// Get unique departments
export const departments = [...new Set(departmentManagers.map(m => m.department))].sort();

// Get managers by department
export const getManagersByDepartment = (department: string): DepartmentManager[] => {
  return departmentManagers.filter(m => m.department === department);
};

// Get manager by name
export const getManagerByName = (name: string): DepartmentManager | undefined => {
  return departmentManagers.find(m => m.displayName === name);
};
