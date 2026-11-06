import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#f4f6f8',
    justifyContent: 'center',
    padding: 24,
  },
  signInCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    maxWidth: 420,
    padding: 32,
    width: '100%',
  },
  signInText: {
    color: '#64748b',
    fontSize: 16,
    marginBottom: 24,
  },
  googleButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
    width: '100%',
  },
  googleButtonText: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingBottom: 20,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  headerButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  errorMessage: {
    color: '#dc2626',
    marginTop: 12,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    padding: 24,
  },
  loggedInContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loggedInText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    maxWidth: 420,
    padding: 24,
    width: '100%',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderColor: '#cbd5e1',
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});

export default styles;
