import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer"
import type { Resume } from "./resume"

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica" },
  header: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
  },
  name: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  headline: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#555",
    marginTop: 2,
  },
  meta: { fontSize: 8, color: "#555", marginTop: 4, flexWrap: "wrap" },
  sectionTitle: {
    fontSize: 8,
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  jobTitle: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  jobMeta: { fontSize: 8, color: "#555" },
  body: { fontSize: 9, lineHeight: 1.35, marginTop: 2 },
  bullet: { fontSize: 9, marginLeft: 10, marginBottom: 1, lineHeight: 1.35 },
  tech: { fontSize: 8, color: "#555", marginTop: 2 },
})

interface PdfTemplateProps {
  resume: Resume
}

export function ResumePdfTemplate({ resume }: PdfTemplateProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{resume.fullName}</Text>
          <Text style={styles.headline}>
            {resume.headline}, based in {resume.location}
          </Text>
          <Text style={styles.meta}>
            {resume.email}
            {resume.phone ? `  ·  ${resume.phone}` : ""}
          </Text>
          {resume.socials.map((s) => {
            return (
              <Link style={styles.meta} href={s.url}>
                {s.label}
              </Link>
            )
          })}
        </View>

        {resume.profile && (
          <View>
            <Text style={styles.sectionTitle}>Profile</Text>
            <Text style={styles.body}>{resume.profile}</Text>
          </View>
        )}

        {resume.workExperience.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {resume.workExperience.map((exp, i) => (
              <View key={i} style={{ marginBottom: 4 }}>
                <View style={[styles.row, { justifyContent: "space-between" }]}>
                  <Text style={styles.jobTitle}>
                    {exp.positionTitle} · {exp.company}
                  </Text>
                  <Text style={styles.jobMeta}>
                    {exp.from} — {exp.to ?? "Present"}
                  </Text>
                </View>
                {exp.location && (
                  <Text style={styles.jobMeta}>{exp.location}</Text>
                )}
                {exp.description && (
                  <Text style={styles.body}>{exp.description}</Text>
                )}
                {exp.keyAchievements.map((a, j) => (
                  <Text key={j} style={styles.bullet}>
                    • {a}
                  </Text>
                ))}
                {(exp.techStack.length > 0 || exp.methodologies.length > 0) && (
                  <Text style={styles.tech}>
                    {exp.techStack.length > 0 &&
                      `Stack: ${exp.techStack.join(", ")}. `}
                    {exp.methodologies.length > 0 &&
                      `Methodologies: ${exp.methodologies.join(", ")}.`}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {resume.education.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Education</Text>
            {resume.education.map((edu, i) => (
              <View
                key={i}
                style={[styles.row, { justifyContent: "space-between" }]}
              >
                <View>
                  <Text style={styles.jobTitle}>{edu.degree}</Text>
                  <Text style={styles.jobMeta}>{edu.university}</Text>
                </View>
                <Text style={styles.jobMeta}>
                  {edu.from} — {edu.to ?? "Present"}
                </Text>
              </View>
            ))}
          </View>
        )}

        {resume.otherAchievements.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Other Achievements</Text>
            {resume.otherAchievements.map((a, i) => (
              <Text key={i} style={styles.bullet}>
                • {a.name}
                {a.date ? ` — ${a.date}` : ""}
              </Text>
            ))}
          </View>
        )}

        {resume.languages.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Languages</Text>
            <Text style={styles.body}>
              {resume.languages
                .map((l) => `${l.name} (${l.level})`)
                .join(" · ")}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  )
}
