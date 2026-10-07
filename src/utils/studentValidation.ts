const NAME_PATTERN = /^[\p{L}\s.'-]+$/u;

export function normalizeStudentName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
}

export function validateStudentName(name: string): string | undefined{
    const normalized = normalizeStudentName(name);
    if(!normalized) {
        return 'Student name is required.';
    }

    if (normalized.length < 2){
        return 'Student name must  be at least 2 characters.';
    }
    if (normalized.length > 60){
        return "Student name must be 60 character or fewer."
    }
    if (!NAME_PATTERN.test(normalized)){
        return 'Student name can only contain letters and spaces'
    }
    return undefined

}